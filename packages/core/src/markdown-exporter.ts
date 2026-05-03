// START_MODULE_CONTRACT
// PURPOSE: Persist parse results into Markdown bundles with predictable layout.
// SCOPE: Filesystem writes only under job directory.
// DEPENDS: fs/promises, path.
// LINKS: M-MARKDOWN-EXPORTER.
// END_MODULE_CONTRACT

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppLogger } from "./logger.js";
import type { ExtractedDocument, StructuredSelection } from "./types.js";

export interface MarkdownExportPayload {
  jobId: string;
  requestedUrl: string;
  fetchedUrl?: string;
  extracted: ExtractedDocument;
  selection: StructuredSelection;
}

export async function writeResultFiles(
  outputRootAbs: string,
  payload: MarkdownExportPayload & { slug: string },
  deps: { correlationId: string; logger: AppLogger }
): Promise<string[]> {
  const root = path.resolve(outputRootAbs, payload.jobId);
  await mkdir(path.join(root, "pages"), { recursive: true });

  deps.logger.info(
    { correlationId: deps.correlationId, outcome: "start", outputRoot: root },
    "[MarkdownExporter][writeResultFiles][BLOCK_EXPORT_MARKDOWN] start"
  );
  try {
    const relativeFiles: string[] = [];

    const pageMarkdown = renderPageMarkdown(payload);
    const pagePathAbs = path.join(root, "pages", `${payload.slug}.md`);
    await writeFile(pagePathAbs, pageMarkdown, "utf8");
    relativeFiles.push(`pages/${payload.slug}.md`);

    await mkdir(path.join(root, "source"), { recursive: true });
    const extractedPathAbs = path.join(root, "source", `${payload.slug}-extracted.md`);
    await writeFile(
      extractedPathAbs,
      `# Extracted Source\n\n**URL**: ${payload.fetchedUrl ?? payload.requestedUrl}\n\n${payload.extracted.mainText}\n`,
      "utf8"
    );
    relativeFiles.push(`source/${payload.slug}-extracted.md`);

    const indexPathAbs = path.join(root, "index.md");
    const truncatedSummary = payload.selection.summary.trim().slice(0, 280).replace(/\s+/g, " ");
    const indexBody =
      `# Parse job ${payload.jobId}\n\n` +
      `- Requested URL: ${payload.requestedUrl}\n` +
      `- Summary: ${truncatedSummary}…\n` +
      `- Files:\n` +
      `${relativeFiles.map((r) => `  - ${r}`).join("\n")}\n`;
    await writeFile(indexPathAbs, indexBody, "utf8");
    relativeFiles.unshift("index.md");

    deps.logger.info(
      { correlationId: deps.correlationId, outcome: "success", filesWritten: relativeFiles.length },
      "[MarkdownExporter][writeResultFiles][BLOCK_EXPORT_MARKDOWN] success"
    );
    return relativeFiles;
  } catch (err) {
    deps.logger.error(
      { correlationId: deps.correlationId, outcome: "write_error", err: String(err) },
      "[MarkdownExporter][writeResultFiles][BLOCK_EXPORT_MARKDOWN] write_error"
    );
    throw err;
  }
}

export async function writeRawExtractOnlyFiles(
  outputRootAbs: string,
  payload: {
    jobId: string;
    slug: string;
    requestedUrl: string;
    fetchedUrl?: string;
    extracted: ExtractedDocument;
  },
  deps: { correlationId: string; logger: AppLogger }
): Promise<string[]> {
  const root = path.resolve(outputRootAbs, payload.jobId);
  await mkdir(path.join(root, "source"), { recursive: true });
  const rel = [`source/${payload.slug}-partial.md`];
  const absPath = path.join(root, rel[0]!);

  deps.logger.warn(
    { correlationId: deps.correlationId, outcome: "partial_only" },
    "[MarkdownExporter][writeRawExtractOnlyFiles][BLOCK_EXPORT_PARTIAL] preserving_extracted_only"
  );
  await writeFile(
    absPath,
    `# Partial Output (AI step failed)\n\n**URL**: ${payload.fetchedUrl ?? payload.requestedUrl}\n\n${payload.extracted.mainText}`,
    "utf8"
  );
  return rel;
}

function renderPageMarkdown(payload: MarkdownExportPayload & { slug: string }): string {
  const lines: string[] = [];
  lines.push(`# ${payload.extracted.title || "Untitled page"}`);
  lines.push("");
  lines.push(`- **Source URL**: ${payload.fetchedUrl ?? payload.requestedUrl}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(payload.selection.summary.trim());
  lines.push("");
  lines.push(`## Key facts`);
  lines.push("");
  payload.selection.keyFacts.forEach((fact) => {
    lines.push(`- ${fact}`);
  });
  if (payload.selection.structuredSections?.length) {
    lines.push("");
    lines.push(`## Structured Notes`);
    lines.push("");
    payload.selection.structuredSections.forEach((section) => {
      lines.push(`### ${section.heading}`);
      lines.push("");
      lines.push(section.body.trim());
      lines.push("");
    });
  }
  return lines.join("\n") + "\n";
}
