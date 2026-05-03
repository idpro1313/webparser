// START_MODULE_CONTRACT
// PURPOSE: Download remote HTML safely with timeouts and payload size guards.
// SCOPE: single GET only; redirects follow default fetch semantics.
// DEPENDS: node fetch (runtime).
// LINKS: M-WEBSITE-FETCHER, V-M-WEBSITE-FETCHER.
// END_MODULE_CONTRACT

// START_CONTRACT: fetchPage
// PURPOSE: GET url and capture html string up to maxBytes.
// INPUTS: url URL, deps { timeoutMs, maxBytes, logger, correlationId }, optional fetchImpl
// OUTPUTS: FetchedPage { finalUrl, status, html }
// SIDE_EFFECTS: HTTP network IO
// LINKS: runParseJob
// END_CONTRACT: fetchPage

import type { AppLogger } from "./logger.js";

export type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface FetchedPage {
  finalUrl: string;
  status: number;
  html: string;
}

export class FetchPageError extends Error {
  readonly code: "FETCH_TIMEOUT" | "FETCH_TOO_LARGE" | "FETCH_NETWORK" | "FETCH_BAD_STATUS";

  constructor(
    message: string,
    code: FetchPageError["code"],
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "FetchPageError";
    this.code = code;
  }
}

export async function fetchPage(
  url: URL,
  deps: {
    timeoutMs: number;
    maxBytes: number;
    logger: AppLogger;
    correlationId: string;
    fetchImpl?: FetchFn;
  }
): Promise<FetchedPage> {
  const impl = deps.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), deps.timeoutMs);
  deps.logger.info(
    { correlationId: deps.correlationId, url: url.toString(), outcome: "start" },
    "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] start"
  );
  try {
    const res = await impl(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": "webparser-bot/0.1 (+https://github.com/local/webparser)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      deps.logger.warn(
        { correlationId: deps.correlationId, status: res.status, outcome: "bad_status" },
        "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] rejected"
      );
      throw new FetchPageError(`Bad HTTP status ${res.status}`, "FETCH_BAD_STATUS");
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      const buf = Buffer.from(text, "utf8");
      if (buf.byteLength > deps.maxBytes) {
        deps.logger.warn(
          { correlationId: deps.correlationId, outcome: "too_large", bytesRead: buf.byteLength },
          "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] too_large"
        );
        throw new FetchPageError(`Response exceeded ${deps.maxBytes} bytes`, "FETCH_TOO_LARGE");
      }
      deps.logger.info(
        { correlationId: deps.correlationId, outcome: "success", bytesRead: buf.byteLength },
        "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] success"
      );
      return { finalUrl: res.url ?? url.toString(), status: res.status, html: text };
    }

    const chunks: Buffer[] = [];
    let bytesRead = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      bytesRead += value.byteLength;
      if (bytesRead > deps.maxBytes) {
        deps.logger.warn(
          { correlationId: deps.correlationId, outcome: "too_large", bytesRead },
          "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] too_large"
        );
        throw new FetchPageError(`Response exceeded ${deps.maxBytes} bytes`, "FETCH_TOO_LARGE");
      }
      chunks.push(Buffer.from(value));
    }
    const html = Buffer.concat(chunks).toString("utf8");
    deps.logger.info(
      { correlationId: deps.correlationId, outcome: "success", bytesRead },
      "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] success"
    );
    return { finalUrl: res.url ?? url.toString(), status: res.status, html };
  } catch (err) {
    if (ctrl.signal.aborted) {
      deps.logger.warn({ correlationId: deps.correlationId, outcome: "timeout" }, "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] timeout");
      throw new FetchPageError(`Fetch timed out after ${deps.timeoutMs}ms`, "FETCH_TIMEOUT", {
        cause: err,
      });
    }
    if (err instanceof FetchPageError) throw err;

    deps.logger.warn(
      { correlationId: deps.correlationId, outcome: "network_error", err: String(err) },
      "[WebsiteFetcher][fetchPage][BLOCK_FETCH_PAGE] network_error"
    );
    throw new FetchPageError("Network fetch failed", "FETCH_NETWORK", { cause: err });
  } finally {
    clearTimeout(timer);
  }
}
