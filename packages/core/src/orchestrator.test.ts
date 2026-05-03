import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import pino from "pino";
import { describe, expect, it } from "vitest";

import { loadCoreConfig } from "./config.js";
import { runParseJob } from "./orchestrator.js";

function mergedEnv(patch: Record<string, string>): NodeJS.ProcessEnv {
  return { ...process.env, ...patch } as NodeJS.ProcessEnv;
}

describe("runParseJob", () => {
  const htmlFactory = (): string =>
    `<html><head><title>E2E</title></head><body><article><p>${"Hello world. ".repeat(
      30
    )}</p></article></body></html>`;

  it("completes success path end-to-end with mocked IO", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "webparser-job-"));

    const config = loadCoreConfig(
      mergedEnv({
        OUTPUT_DIR: tmp,
        FETCH_TIMEOUT_MS: "90000",
        OPENAI_API_KEY: "test-key",
        OPENAI_JSON_MODE: "false",
      })
    );

    const fetchHtml = async (): Promise<Response> =>
      new Response(htmlFactory(), { status: 200, headers: { "content-type": "text/html" } });

    const fetchAi = async (): Promise<Response> =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "Done summary.",
                  keyFacts: ["f1"],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    const logger = pino({ level: "silent" });
    const outcome = await runParseJob(
      { logger, config, correlationId: "corr-ok", fetchHtml, fetchAi },
      { jobId: "job-xyz", urlRaw: "https://example.invalid/page" }
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.relativeFiles).toContain("index.md");
  });

  it("surfaces insufficient content without AI call", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "webparser-job-"));
    const config = loadCoreConfig(
      mergedEnv({
        OUTPUT_DIR: tmp,
      })
    );

    const fetchHtml = async (): Promise<Response> =>
      new Response(`<html><head><title>X</title></head><body></body></html>`, {
        status: 200,
        headers: { "content-type": "text/html" },
      });

    const fetchAiSpy = (): Promise<Response> =>
      Promise.reject(new Error("should not call AI"));

    const logger = pino({ level: "silent" });
    const outcome = await runParseJob(
      { logger, config, correlationId: "corr-empty", fetchHtml, fetchAi: fetchAiSpy },
      { jobId: "job-empty", urlRaw: "https://empty.example.invalid" }
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error();
    expect(outcome.code).toBe("INSUFFICIENT_CONTENT");
  });

  it("persists extracted text when AI step fails", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "webparser-job-"));

    const config = loadCoreConfig(
      mergedEnv({
        OUTPUT_DIR: tmp,
        FETCH_TIMEOUT_MS: "90000",
        OPENAI_API_KEY: "test-key",
        OPENAI_JSON_MODE: "false",
      })
    );

    const fetchHtml = async (): Promise<Response> =>
      new Response(htmlFactory(), { status: 200, headers: { "content-type": "text/html" } });

    const fetchAi = async (): Promise<Response> => new Response("bad", { status: 429 });

    const logger = pino({ level: "silent" });

    const outcome = await runParseJob(
      { logger, config, correlationId: "corr-ai-fail", fetchHtml, fetchAi },
      { jobId: "job-ai-fail", urlRaw: "https://fail.example.invalid/" }
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error();
    expect(outcome.partialOutputs?.some((p) => p.endsWith("-partial.md"))).toBe(true);
  });
});
