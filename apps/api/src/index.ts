import "dotenv/config";

import cors from "@fastify/cors";
import { createLogger, loadAppConfig, normalizeUrl } from "@webparser/core";
import Fastify from "fastify";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { PARSE_JOB_NAME, createParseQueue } from "./queue.js";

async function main(): Promise<void> {
  const config = loadAppConfig();
  const logger = createLogger("api");
  const { queue: parseQueue, redis: redisConnection } = createParseQueue(config.redisUrl);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [/http:\/\/localhost:\d+/, /http:\/\/127\.0\.0\.1:\d+/],
  });

  app.get("/api/health", async () => {
    return { ok: true as const, service: "webparser-api" };
  });

  app.get("/api/ready", async (request, reply) => {
    try {
      const pong = await redisConnection.ping();
      if (pong !== "PONG") {
        request.log.warn({ outcome: "unexpected_pong", pong }, "[HttpApi][GET /api/ready][BLOCK_REDIS_PROBE] rejected");
        return reply.code(503).send({ ok: false as const, redis: false });
      }
      request.log.debug({ outcome: "pong" }, "[HttpApi][GET /api/ready][BLOCK_REDIS_PROBE] success");
      return { ok: true as const, redis: true };
    } catch (err) {
      request.log.error(
        { outcome: "error", err: String(err) },
        "[HttpApi][GET /api/ready][BLOCK_REDIS_PROBE] rejected"
      );
      return reply.code(503).send({ ok: false as const, redis: false });
    }
  });

  app.post<{ Body: { url?: string } }>("/api/jobs", async (request, reply) => {
    const url = request.body?.url;
    if (!url || typeof url !== "string") {
      request.log.warn(
        { outcome: "rejected", reason: "missing_url" },
        "[HttpApi][createJobHandler][BLOCK_API_VALIDATE_BODY] rejected"
      );
      return reply.code(400).send({ error: "url_required" });
    }

    try {
      normalizeUrl(url);
    } catch {
      request.log.warn(
        { outcome: "rejected", reason: "invalid_url" },
        "[HttpApi][createJobHandler][BLOCK_API_VALIDATE_BODY] rejected"
      );
      return reply.code(400).send({ error: "invalid_url" });
    }

    request.log.info(
      { outcome: "accepted", urlSnippet: `${url.slice(0, 32)}…` },
      "[HttpApi][createJobHandler][BLOCK_API_VALIDATE_BODY] accepted"
    );

    try {
      request.log.info({ outcome: "start" }, "[JobQueueAdapter][enqueueParseJob][BLOCK_ENQUEUE] start");
      const job = await parseQueue.add(PARSE_JOB_NAME, { url });
      request.log.info(
        { outcome: "success", jobId: job.id },
        "[JobQueueAdapter][enqueueParseJob][BLOCK_ENQUEUE] success"
      );
      return reply.code(202).send({ jobId: job.id });
    } catch (err) {
      request.log.error({ outcome: "enqueue_error", err: String(err) }, "[JobQueueAdapter][enqueueParseJob][BLOCK_ENQUEUE] enqueue_error");
      return reply.code(500).send({ error: "enqueue_failed" });
    }
  });

  app.get<{ Params: { jobId: string } }>("/api/jobs/:jobId", async (request, reply) => {
    const jobId = request.params.jobId;
    const job = await parseQueue.getJob(jobId);
    if (!job) {
      return reply.code(404).send({ error: "job_not_found" });
    }

    const state = await job.getState();
    const returnvalue = job.returnvalue ?? null;

    request.log.debug(
      { jobId, state },
      "[HttpApi][GET /api/jobs/:jobId][BLOCK_API_GET_JOB] ok"
    );

    return {
      jobId,
      state,
      returnvalue,
      failedReason: job.failedReason ?? null,
    };
  });

  app.get<{ Params: { jobId: string } }>("/api/jobs/:jobId/files", async (request, reply) => {
    const jobId = request.params.jobId;
    const dir = path.join(config.outputDir, jobId);

    async function collectFiles(absRoot: string): Promise<Array<{ relativePath: string; type: "dir" | "file" }>> {
      const out: Array<{ relativePath: string; type: "dir" | "file" }> = [];
      async function walk(abs: string, rel: string): Promise<void> {
        const dirents = await readdir(abs, { withFileTypes: true });
        for (const d of dirents) {
          const childAbs = path.join(abs, d.name);
          const childRelPosix = path.posix.join(rel, d.name);
          if (d.isDirectory()) {
            out.push({ relativePath: `${childRelPosix}/`, type: "dir" });
            await walk(childAbs, childRelPosix);
          } else if (d.isFile()) {
            out.push({ relativePath: childRelPosix, type: "file" });
          }
        }
      }
      await walk(absRoot, "");
      return out;
    }

    try {
      const files = await collectFiles(dir);

      const job = await parseQueue.getJob(jobId);
      const jobState = job ? await job.getState() : "missing_queue_job";

      request.log.debug(
        { jobId, entries: files.length },
        "[HttpApi][GET /api/jobs/:jobId/files][BLOCK_LIST_FILES] ok"
      );

      return { outputDirRelative: jobId, files, jobState };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return reply.code(404).send({ error: "artifacts_not_found" });
      }
      throw err;
    }
  });

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "[HttpApi][shutdown][BLOCK_SHUTDOWN] start");
    try {
      await app.close();
      await parseQueue.close();
    } catch (err) {
      logger.error({ err: String(err) }, "[HttpApi][shutdown][BLOCK_SHUTDOWN] error");
    } finally {
      try {
        await redisConnection.quit();
      } catch {
        redisConnection.disconnect();
      }
    }
    logger.info({ signal }, "[HttpApi][shutdown][BLOCK_SHUTDOWN] done");
    process.exit(0);
  };

  const address = await app.listen({ port: config.apiPort, host: "0.0.0.0" });
  logger.info({ address }, "[HttpApi][bootstrap][BLOCK_LISTENING] listening");

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
