// START_MODULE_CONTRACT
// PURPOSE: Create structured JSON loggers for API, worker, and core modules.
// SCOPE: pino factory wrappers; correlation fields (jobId) added by callers via child().
// DEPENDS: pino (runtime).
// LINKS: M-LOGGER, tests/test_guide.md (V-M-LOGGER).
// END_MODULE_CONTRACT

// START_MODULE_MAP
// createLogger - root logger factory
// END_MODULE_MAP

import pino from "pino";

export type AppLogger = pino.Logger;

export function createLogger(name?: string): AppLogger {
  const level = process.env.LOG_LEVEL ?? "info";
  const base = pino({ level, name: name ?? "webparser" });
  return base;
}
