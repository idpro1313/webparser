import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import pino from "pino";
import { describe, expect, it } from "vitest";

import { writeResultFiles } from "./markdown-exporter.js";

describe("MarkdownExporter.writeResultFiles", () => {
  const logger = pino({ level: "silent" });

  it("writes index, page, extracted source markdown", async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "webparser-md-"));

    const files = await writeResultFiles(
      tmpDir,
      {
        jobId: "job-123",
        slug: "example-com-readme",
        requestedUrl: "https://example.com/readme",
        fetchedUrl: "https://example.com/readme",
        extracted: {
          title: "Readme",
          mainText: "Sample extracted text.".repeat(5),
          headings: ["Docs"],
        },
        selection: {
          summary: "Summary line.",
          keyFacts: ["Fact A"],
        },
      },
      {
        correlationId: "md1",
        logger,
      }
    );

    expect(files.some((p) => p === "index.md")).toBe(true);
    await expect(readFile(path.join(tmpDir, "job-123", "index.md"), "utf8")).resolves.toContain("Summary line");
    await expect(readFile(path.join(tmpDir, "job-123", "pages/example-com-readme.md"), "utf8")).resolves.toContain(
      "## Key facts"
    );
  });
});
