// START_MODULE_CONTRACT
// PURPOSE: BullMQ queue wiring for parse jobs.
// SCOPE: Connection + queue creation (API process).
// DEPENDS: bullmq, ioredis.
// LINKS: M-JOB-QUEUE.
// END_MODULE_CONTRACT

import { PARSE_QUEUE_NAME } from "@webparser/core";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

export { PARSE_JOB_NAME } from "@webparser/core";

export interface ParseQueueDeps {
  queue: Queue;
  redis: Redis;
}

export function createParseQueue(redisUrl: string): ParseQueueDeps {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  const queue = new Queue(PARSE_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: 24 * 3600, count: 500 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  });

  return { queue, redis };
}

