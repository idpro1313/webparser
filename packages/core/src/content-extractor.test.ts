import pino from "pino";
import { describe, expect, it } from "vitest";

import { extractMainContent, MIN_MEANINGFUL_CHARS } from "./content-extractor.js";

describe("ContentExtractor.extractMainContent", () => {
  const logger = pino({ level: "silent" });
  const cid = "c1";

  it("reports sufficient outcome for rich markup", () => {
    const html = `
      <html><head><title>Hello Title</title></head>
      <body><article><p>${"Meaningful text. ".repeat(20)}</p></article></body></html>
    `;
    const extracted = extractMainContent(html, { logger, correlationId: cid });
    expect(extracted.title).toContain("Hello");
    expect(extracted.mainText.length).toBeGreaterThan(MIN_MEANINGFUL_CHARS);
  });

  it("reports insufficient for empty body", () => {
    const html = `<html><head><title>X</title></head><body></body></html>`;
    extractMainContent(html, { logger, correlationId: cid });
    expect(true).toBe(true);
    const extracted = extractMainContent(html, { logger, correlationId: "c2" });
    expect(extracted.mainText.trim().length).toBeLessThan(MIN_MEANINGFUL_CHARS);
  });
});
