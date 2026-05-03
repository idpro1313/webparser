# GRACE Logging and Trace Rules

Logs are evidence for agents. They should let another agent connect runtime behavior back to contracts, semantic blocks, and verification scenarios.

## Branching and control-flow observability

**Goal.** Another agent (or on-call human) must be able to answer, from **production or test logs alone**, which **control-flow branches actually ran**: which arm of a condition, which early return, which error path, which retry or fallback. Final return values and HTTP status codes are not enough; two different trajectories can yield the same outcome.

**What to instrument**

- **Behavior-changing branches:** any branch where a different choice implies different side effects, different invariants, different user-visible or security outcome, or a different failure mode. Log **once per distinct outcome path**, not only the happy path.
- **Mutually exclusive arms:** in `if / else if / else`, `switch`, pattern matches, and ternary-heavy flows, each **arm that can run in production** should emit a **distinguishable** marker (or one marker with a **stable structured field** such as `branch`, `outcome`, `path`, `reasonCode` that takes exclusive values per arm). An agent reading the trace must not have to guess which arm was taken.
- **Guard clauses and early returns:** validation failures, auth denials, not-found shortcuts, and “skip work” branches need markers as much as the main flow. Silent early exits are a common reason agents misread stack traces.
- **Async and concurrency:** when ordering matters, log the decision to schedule, cancel, or skip work. When only one branch should win (timeouts, races), the winning branch should be explicit in logs.
- **Loops and batching:** when “no iteration” vs “some iteration” changes meaning, log at least a **summary marker** (count processed, skipped, failed) at `IMP` appropriate to risk—not every iteration unless the domain requires it.

**Scope by risk (avoid noise, avoid blind spots)**

- **High-risk and high-autonomy modules** (money, security, data integrity, irreversible writes, external APIs): prefer **near-complete** branch coverage in logs for the governed function or flow. Missing a branch marker here is a **verification defect**.
- **Medium complexity:** all branches that affect I/O or persisted state; happy path plus every structured error path.
- **Low-risk pure helpers:** entry/exit or failure may suffice, but if a helper sits on a critical path, elevate it to the stricter tier.

**Production vs tests**

- The same **stable markers** (or strict LDD lines) should be observable in **both** environments where the code path runs. Tests prove trajectory; production proves reality. If tests use a test logger or spy, they must still assert the **same marker strings or fields** the production logger expects, so evidence stays comparable.
- For each **named scenario** in `docs/verification-plan.xml`, define which markers must appear (**required**), which must **not** appear (**forbidden**), and **order** when sequence disambiguates branches.

**Anti-patterns**

- Logging only the success path while errors are invisible or generic (“failed”).
- One log line before a large `if` tree with no per-branch anchors—agents cannot reconstruct the path.
- Different marker conventions in tests vs production for the same block.

**Relation to semantic blocks.** Each instrumented branch should map to a **block name** (or a dedicated sub-block) used in contracts and verification. Renaming blocks requires updating markers and `required-log-markers` in lockstep.

## Default Marker Format

Use stable markers for important logs:

```text
[ModuleName][functionName][BLOCK_NAME] message
```

Prefer structured logger fields for context:

```text
logger.info("[Checkout][createOrder][BLOCK_PERSIST_ORDER] order persisted", {
  orderId,
  correlationId,
});
```

## Strict LDD Format

For critical/high-autonomy paths, use strict Log Driven Development markers:

```text
[CLASSIFIER][IMP:1-10][FUNCTION][BLOCK][OPERATION] Description [STATUS]
```

Classifier examples:

- `VALIDATION`
- `DB`
- `API`
- `IO`
- `LOGIC`
- `SECURITY`
- `PAYMENT`

Importance scale:

- `IMP:1-3`: local trace/debug details;
- `IMP:4-6`: normal flow transitions;
- `IMP:7-8`: external I/O, DB, API, filesystem;
- `IMP:9-10`: business-critical decisions, invariants, security, money, irreversible side effects.

## Required Log Points

For critical functions, log:

- entry when inputs are needed for diagnosis;
- validation failures;
- branch decisions that affect behavior;
- external calls and side effects;
- retries and fallback decisions;
- final success/failure outcome.

Use the same block names that appear in code and verification entries.

## Verification Expectations

Tests should assert deterministic outcomes first.

Add trace/log assertions when:

- the path matters, not just the final value;
- failure handling must avoid a forbidden side effect;
- retries, idempotency, permissions, or ordering matter;
- another agent would need the trace to debug failures.

Typical assertions:

- required marker appeared;
- forbidden marker did not appear;
- marker order matches the scenario;
- high-importance error includes a stable reason code.

## Forbidden Logging

Never log:

- secrets, credentials, tokens, private keys;
- raw high-risk payloads;
- hidden chain-of-thought or private model reasoning;
- decorative messages with no diagnostic value;
- unstable prose when a stable field or reason code is available.

## Failure Handoff

When logs reveal a failure, capture:

- scenario;
- expected marker/evidence;
- observed marker/evidence;
- first divergent block;
- suggested next action.

This should align with `FailurePacket` in `docs/operational-packets.xml`.
