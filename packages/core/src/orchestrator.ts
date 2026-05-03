// START_MODULE_CONTRACT
// PURPOSE: Compose fetch → extraction → AI → Markdown persistence for single-URL parses.
// SCOPE: One job invocation; deterministic orchestration branching.
// DEPENDS: M-WEBSITE-FETCHER modules in core package.
// LINKS: M-JOB-ORCHESTRATOR, DF-001.
// END_MODULE_CONTRACT

// START_MODULE_MAP
// runParseJob - full pipeline entry point
// urlToSlug - filesystem-safe slug
// END_MODULE_MAP

import { selectKeyInformation } from "./ai-adapter.js";
import type { CoreConfig } from "./config.js";
import { extractMainContent, isExtractedDocumentSufficient } from "./content-extractor.js";
import type { AppLogger } from "./logger.js";
import { writeRawExtractOnlyFiles, writeResultFiles } from "./markdown-exporter.js";
import type { ParseJobOutcome } from "./types.js";
import { FetchPageError, fetchPage, type FetchFn as FetchHtmlFn } from "./website-fetcher.js";

export interface ParseJobDeps {
  logger: AppLogger;
  config: CoreConfig;
  correlationId: string;
  fetchHtml?: FetchHtmlFn;
  fetchAi?: import("./ai-adapter.js").AiFetchFn;
}

export async function runParseJob(deps: ParseJobDeps, input: { jobId: string; urlRaw: string }): Promise<ParseJobOutcome> {
  let url: URL;
  try {
    url = normalizeUrl(input.urlRaw);
    deps.logger.info(
      { correlationId: deps.correlationId, outcome: "accepted", url: url.toString() },
      "[JobOrchestrator][runParseJob][BLOCK_VALIDATE_REQUEST] accepted"
    );
  } catch (err) {
    deps.logger.warn(
      { correlationId: deps.correlationId, outcome: "rejected", err: String(err) },
      "[JobOrchestrator][runParseJob][BLOCK_VALIDATE_REQUEST] rejected"
    );
    return { ok: false, code: "INVALID_URL", message: "URL must use http/https and be syntactically valid" };
  }

  const slug = urlToSlug(url);

  try {
    const fetched = await fetchPage(url, {
      timeoutMs: deps.config.fetchTimeoutMs,
      maxBytes: deps.config.fetchMaxBytes,
      logger: deps.logger,
      correlationId: deps.correlationId,
      fetchImpl: deps.fetchHtml,
    });

    const extracted = extractMainContent(fetched.html, {
      logger: deps.logger,
      correlationId: deps.correlationId,
    });

    if (!isExtractedDocumentSufficient(extracted)) {
      return {
        ok: false,
        code: "INSUFFICIENT_CONTENT",
        message: "Extracted markup did not yield enough textual content",
      };
    }

    try {
      const selection = await selectKeyInformation(extracted, fetched.finalUrl, {
        correlationId: deps.correlationId,
        logger: deps.logger,
        config: deps.config,
        fetchImpl: deps.fetchAi,
      });

      const written = await writeResultFiles(
        deps.config.outputDir,
        {
          jobId: input.jobId,
          slug,
          requestedUrl: url.toString(),
          fetchedUrl: fetched.finalUrl,
          extracted,
          selection,
        },
        {
          correlationId: deps.correlationId,
          logger: deps.logger,
        }
      );

      return {
        ok: true,
        outputRelativeDir: input.jobId,
        relativeFiles: written,
      };
    } catch (err: unknown) {
      const aiCode = classifyAiFailure(err);

      deps.logger.warn(
        { correlationId: deps.correlationId, aiCode },
        "[JobOrchestrator][runParseJob][BLOCK_AI_AND_EXPORT] ai_step_failed_attempt_partial"
      );
      try {
        const partial = await writeRawExtractOnlyFiles(
          deps.config.outputDir,
          {
            jobId: input.jobId,
            slug,
            requestedUrl: url.toString(),
            fetchedUrl: fetched.finalUrl,
            extracted,
          },
          {
            correlationId: deps.correlationId,
            logger: deps.logger,
          }
        );
        return {
          ok: false,
          code: aiCode,
          message: String((err as Error)?.message ?? err),
          partialOutputs: partial,
        };
      } catch {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }
  } catch (err) {
    if (err instanceof FetchPageError) {
      return { ok: false, code: err.code, message: err.message };
    }

    deps.logger.error(
      { correlationId: deps.correlationId, err: String(err) },
      "[JobOrchestrator][runParseJob][BLOCK_UNEXPECTED] orphan_error"
    );
    throw err instanceof Error ? err : new Error(String(err));
  }
}

function classifyAiFailure(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "AI_INVALID_RESPONSE") return "AI_INVALID_RESPONSE";
    if (code === "AI_MISSING_API_KEY") return "AI_MISSING_API_KEY";
  }
  return "AI_PROVIDER_ERROR";
}

export function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  let url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Unsupported scheme");
  }
  return url;
}

export function urlToSlug(url: URL): string {
  const raw = `${url.hostname}-${url.pathname}`.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return raw.slice(0, 96).length ? raw.slice(0, 96) : "page";
}
