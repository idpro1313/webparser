import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ConfigurationError, loadAppConfig, loadCoreConfig } from "./config.js";

describe("config", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
    delete process.env.REDIS_URL;
    delete process.env.OUTPUT_DIR;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENAI_MODEL;
    delete process.env.API_PORT;
    delete process.env.FETCH_TIMEOUT_MS;
    delete process.env.FETCH_MAX_BYTES;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("loadCoreConfig works without REDIS_URL", () => {
    process.env.REDIS_URL = ""; // intentionally unset semantics handled by empties in readEnv trimming
    const cfg = loadCoreConfig(process.env);
    expect(cfg.fetchTimeoutMs).toBeGreaterThan(0);
    expect(cfg.fetchMaxBytes).toBeGreaterThan(0);
  });

  it("loadAppConfig throws when REDIS_URL missing", () => {
    delete process.env.REDIS_URL;
    expect(() => loadAppConfig(process.env)).toThrow(ConfigurationError);
  });

  it("loadAppConfig accepts REDIS_URL", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const cfg = loadAppConfig(process.env);
    expect(cfg.redisUrl).toContain("redis://");
  });
});
