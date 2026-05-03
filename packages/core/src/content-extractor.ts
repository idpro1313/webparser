// START_MODULE_CONTRACT
// PURPOSE: Convert HTML markup into readable main text suitable for prompting an LLM.
// SCOPE: heuristic extraction via node-html-parser; no crawling.
// DEPENDS: node-html-parser.
// LINKS: M-CONTENT-EXTRACTOR.
// END_MODULE_CONTRACT

import { parse } from "node-html-parser";
import type { AppLogger } from "./logger.js";
import type { ExtractedDocument } from "./types.js";

export const MIN_MEANINGFUL_CHARS = 80;

export function isExtractedDocumentSufficient(extracted: ExtractedDocument): boolean {
  const compact = normalizeText(extracted.mainText).replace(/\s+/g, " ").trim();
  return compact.length >= MIN_MEANINGFUL_CHARS || extracted.headings.length >= 2;
}

export function extractMainContent(
  html: string,
  deps: { logger: AppLogger; correlationId: string }
): ExtractedDocument {
  const doc = parse(html);

  doc.querySelectorAll("script, style, noscript, svg").forEach((n) => n.remove());

  const title = doc.querySelector("title")?.text?.trim() ?? "";

  let root =
    doc.querySelector("article") ??
    doc.querySelector("[role='main']") ??
    doc.querySelector("main") ??
    doc.querySelector("body") ??
    doc;

  const headings: string[] = [];
  root.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
    const txt = normalizeText(h.text);
    if (txt) headings.push(txt);
  });

  const mainText = normalizeText(root.text);

  const extracted: ExtractedDocument = {
    title,
    mainText,
    headings,
  };

  const sufficient = isExtractedDocumentSufficient(extracted);
  const outcome = sufficient ? "sufficient" : "insufficient";
  deps.logger.info(
    {
      correlationId: deps.correlationId,
      outcome,
      textLen: mainText.length,
      headingsCount: headings.length,
    },
    "[ContentExtractor][extractMainContent][BLOCK_EXTRACT_CONTENT]"
  );

  return extracted;
}

function normalizeText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+\n+/g, "\n").trim();
}
