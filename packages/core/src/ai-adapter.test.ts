import pino from "pino";
import { describe, expect, it } from "vitest";

import { selectKeyInformation } from "./ai-adapter.js";
import type { ExtractedDocument } from "./types.js";

describe("AiAdapter.selectKeyInformation", () => {
  const logger = pino({ level: "silent" });

  const baseExtracted: ExtractedDocument = {
    title: "T",
    mainText: "Body text repeated enough for tests. ".repeat(10),
    headings: ["Overview"],
  };

  const config = {
    openaiBaseUrl: "https://example.invalid/openai-proxy",
    openaiApiKey: "dummy",
    openaiModel: "test-model",
    openAiJsonMode: false,
  };

  it("parses structured json from assistants message.content", async () => {
    const fetchImpl = async (): Promise<Response> =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "Short summary.",
                  keyFacts: ["fact1", "fact2"],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    const out = await selectKeyInformation(baseExtracted, "https://source.example", {
      correlationId: "a1",
      logger,
      config,
      fetchImpl,
    });

    expect(out.summary).toContain("Short");
    expect(out.keyFacts).toHaveLength(2);
  });

  it("throws AiAdapterError invalid_response for JSON parse failures", async () => {
    const fetchImpl = async (): Promise<Response> =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: `{ "summary": "` } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    await expect(
      selectKeyInformation(baseExtracted, "https://source.example", {
        correlationId: "a2",
        logger,
        config,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: "AI_INVALID_RESPONSE" });
  });

  it("throws when provider returns non ok", async () => {
    const fetchImpl = async (): Promise<Response> => new Response("bad", { status: 429 });
    await expect(
      selectKeyInformation(baseExtracted, "https://source.example", {
        correlationId: "a3",
        logger,
        config,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
  });
});
