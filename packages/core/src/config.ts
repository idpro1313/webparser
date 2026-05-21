// START_MODULE_CONTRACT
// PURPOSE: Load and validate environment-driven configuration used by worker/API and core parsers.
// SCOPE: env parsing only; secrets must never be logged.
// DEPENDS: none.
// LINKS: M-CONFIG, plans/AppGraph.xml.
// END_MODULE_CONTRACT

// START_MODULE_MAP
// loadCoreConfig - config for orchestrator (no Redis)
// loadAppConfig - Redis + Core for API/worker processes
// END_MODULE_MAP

// START_CONTRACT: ensureNumber
// PURPOSE: Parse non-negative finite number from env with default or throw.
// INPUTS: raw from process.env[name], fallback optional
// OUTPUTS: number
// SIDE_EFFECTS: none
// LINKS: loadCoreConfig
// END_CONTRACT: ensureNumber

import path from "node:path";

export interface CoreConfig {
  outputDir: string;
  openaiBaseUrl: string;
  openaiApiKey: string | undefined;
  openaiModel: string;
  openAiJsonMode: boolean;
  fetchTimeoutMs: number;
  fetchMaxBytes: number;
}

export interface AppConfig extends CoreConfig {
  redisUrl: string;
  apiPort: number;
}

export class ConfigurationError extends Error {
  readonly code = "CONFIG_INVALID";
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

function readEnvFrom(scope: NodeJS.ProcessEnv, key: string): string | undefined {
  const val = scope[key];
  if (typeof val !== "string" || val.trim() === "") return undefined;
  return val.trim();
}

function ensureNumber(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ConfigurationError(`${name} must be a positive finite number`);
  }
  return n;
}

function ensureBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const v = raw.toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  throw new ConfigurationError(`Boolean env parse failed for value "${raw}"`);
}

export function loadCoreConfig(env: NodeJS.ProcessEnv = process.env): CoreConfig {
  const outputRaw = env.OUTPUT_DIR;
  const outputDir = outputRaw?.trim()?.length ? path.resolve(outputRaw) : path.resolve(process.cwd(), "output");

  const baseUrl = readEnvFrom(env, "OPENAI_BASE_URL") ?? "https://api.openai.com/v1";

  const openaiApiKey = readEnvFrom(env, "OPENAI_API_KEY");
  const openaiModel = readEnvFrom(env, "OPENAI_MODEL") ?? "gpt-4o-mini";
  const openAiJsonMode = ensureBool(readEnvFrom(env, "OPENAI_JSON_MODE"), true);

  const fetchTimeoutMs = ensureNumber(env.FETCH_TIMEOUT_MS, "FETCH_TIMEOUT_MS", 20_000);
  const fetchMaxBytes = ensureNumber(env.FETCH_MAX_BYTES, "FETCH_MAX_BYTES", 2_000_000);

  return {
    outputDir,
    openaiBaseUrl: baseUrl.replace(/\/+$/, ""),
    openaiApiKey,
    openaiModel,
    openAiJsonMode,
    fetchTimeoutMs,
    fetchMaxBytes,
  };
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const core = loadCoreConfig(env);

  const redisUrl = readEnvFrom(env, "REDIS_URL");
  if (!redisUrl) throw new ConfigurationError("REDIS_URL is required for API/worker processes");

  const apiPort = ensureNumber(env.API_PORT, "API_PORT", 3000);

  return { ...core, redisUrl, apiPort };
}
