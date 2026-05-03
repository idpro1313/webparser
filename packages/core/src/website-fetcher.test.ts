import pino from "pino";
import { describe, expect, it } from "vitest";

import { FetchPageError, fetchPage } from "./website-fetcher.js";

describe("WebsiteFetcher.fetchPage", () => {
  const logger = pino({ level: "silent" });
  const correlationId = "t1";

  it("marks FETCH_BAD_STATUS when HTTP not ok", async () => {
    const fetchImpl = async (): Promise<Response> =>
      new Response("nope", { status: 500, headers: { "content-type": "text/plain" } });

    try {
      await fetchPage(new URL("https://example.invalid/page"), {
        timeoutMs: 1000,
        maxBytes: 1000,
        logger,
        correlationId,
        fetchImpl,
      });
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(FetchPageError);
      expect((err as FetchPageError).code).toBe("FETCH_BAD_STATUS");
    }
  });

  it("maps stalled fetch over timeout to FETCH_TIMEOUT", async () => {
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (init?.signal?.aborted) {
          abort();
          return;
        }
        init?.signal?.addEventListener("abort", abort, { once: true });
      });

    await expect(
      fetchPage(new URL("https://slow.example.invalid"), {
        timeoutMs: 20,
        maxBytes: 50_000,
        logger,
        correlationId,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: "FETCH_TIMEOUT" });
  });
});
