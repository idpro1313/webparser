// START_MODULE_CONTRACT
// PURPOSE: Canonical BullMQ identifiers shared across API and worker.
// SCOPE: String constants only.
// DEPENDS: none.
// LINKS: M-JOB-QUEUE.
// ROLE: UTIL.
// MAP_MODE: EXPORTS.
// END_MODULE_CONTRACT

/** BullMQ Queue name storing parse workloads. Must match Worker registration. */
export const PARSE_QUEUE_NAME = "parse";

/** Payload job name distinguishing parse handlers from future job types. */
export const PARSE_JOB_NAME = "parse-page";
