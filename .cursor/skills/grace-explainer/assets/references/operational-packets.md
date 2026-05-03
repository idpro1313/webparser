# Operational Packets

Operational packets — это handoff-формат, который держит GRACE execution ограниченным и проверяемым.

## Зачем Нужны Packets

Агенты теряют надежность, когда вынуждены выводить task scope из длинной истории чата. Packet дает worker ровно то, что нужно:

- module identity;
- write scope;
- contract excerpt;
- graph excerpt;
- dependency summaries;
- verification excerpt;
- assumptions;
- stop conditions;
- retry budget;
- expected deltas;
- checkpoint fields.

## Packet Types

### ExecutionPacket

Controller-to-worker packet для одного module или bounded slice.

Должен включать:

- `module-id`;
- `module-name`;
- `purpose`;
- `write-scope`;
- `contract-excerpt`;
- `graph-entry-excerpt`;
- `dependency-contract-summaries`;
- `verification-excerpt`;
- `assumptions`;
- `stop-conditions`;
- `retry-budget`.

### GraphDelta

Worker-to-controller proposal для public graph changes.

Включайте только public facts:

- imports added/removed;
- exports added/removed;
- annotations added/removed;
- CrossLinks added/removed.

Не включайте churn вокруг private helpers.

### VerificationDelta

Worker-to-controller proposal для изменений proof surface.

Включает:

- test files;
- module-local commands;
- required log markers (**включая различимые маркеры для важных веток**, не только happy path, по `rules/grace-logging.md`);
- required trace assertions;
- wave follow-up;
- phase follow-up.

### FailurePacket

Verification-to-fixer handoff.

Включает:

- scenario;
- contract ref;
- expected evidence;
- observed evidence;
- first divergent block;
- suggested next action.

### CheckpointReport

Короткая progress memory для workers/controllers.

Включает:

- scope;
- assumptions kept;
- commands run;
- evidence captured;
- retry budget used;
- next action.

## Ownership Rule

В multi-agent execution:

- controller владеет shared artifacts и packet assembly;
- workers владеют только своим write scope;
- reviewers валидируют evidence и deltas;
- controller централизованно применяет updates для graph/verification/plan.

Параллелизм безопасен только тогда, когда у architectural truth есть один владелец.
