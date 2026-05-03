import "dotenv/config";

import { Worker } from "bullmq";
import { createLogger, loadAppConfig, runParseJob, PARSE_JOB_NAME, PARSE_QUEUE_NAME } from "@webparser/core";
import { Redis } from "ioredis";

async function main(): Promise<void> {
  const config = loadAppConfig();
  const rootLogger = createLogger("worker");

  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    PARSE_QUEUE_NAME,
    async (job) => {
      if (job.name !== PARSE_JOB_NAME) {
        return;
      }

      const url = Reflect.get(job.data as object, "url");
      if (typeof url !== "string") {
        rootLogger.warn(
          { outcome: "rejected", jobId: job.id },
          "[ParseWorker][processor][BLOCK_VALIDATE_JOB_PAYLOAD] rejected"
        );
        throw new Error("job_payload_missing_url");
      }

      const logger = rootLogger.child({ jobId: job.id });
      logger.info({ outcome: "start" }, "[ParseWorker][processor][BLOCK_WORKER_JOB_START] start");

      const outcome = await runParseJob(
        {
          logger,
          config,
          correlationId: String(job.id),
        },
        { jobId: String(job.id), urlRaw: url }
      );

      if (!outcome.ok) {
        logger.warn(
          { outcome: "failed_job", code: outcome.code },
          "[ParseWorker][processor][BLOCK_WORKER_JOB_FAILED] failed"
        );
        throw new Error(`${outcome.code}: ${outcome.message}`);
      }

      logger.info(
        {
          outcome: "success",
          files: outcome.relativeFiles.length,
        },
        "[ParseWorker][processor][BLOCK_WORKER_JOB_SUCCESS] success"
      );

      return {
        relativeFiles: outcome.relativeFiles,
        outputRelativeDir: outcome.outputRelativeDir,
      };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    rootLogger.error({ jobId: job?.id, err: String(err) }, "[ParseWorker][emitter][JOB_FAILED]");
  });

  worker.on("completed", (job) => {
    rootLogger.info({ jobId: job.id }, "[ParseWorker][emitter][JOB_COMPLETED]");
  });

  let stopping = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (stopping) return;
    stopping = true;
    rootLogger.info({ signal }, "[ParseWorker][shutdown][BLOCK_SHUTDOWN] start");
    try {
      await worker.close();
    } catch (err) {
      rootLogger.error({ err: String(err) }, "[ParseWorker][shutdown][BLOCK_SHUTDOWN] worker_close_error");
    } finally {
      try {
        await connection.quit();
      } catch {
        connection.disconnect();
      }
    }
    rootLogger.info({ signal }, "[ParseWorker][shutdown][BLOCK_SHUTDOWN] done");
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  rootLogger.info(
    {
      redisUrlMasked: "***",
      queue: PARSE_QUEUE_NAME,
    },
    "[ParseWorker][bootstrap][BLOCK_LISTENING] worker_ready"
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
