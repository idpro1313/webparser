# GRACE Framework - Project Engineering Protocol

Maintenance note: this template is synthesized from GRACE package rules, references, and artifact templates.

## Keywords
web-parser, graceful-extraction, openai-compatible, bullmq, markdown-export

## Annotation
Умный парсер веб-сайтов: загрузка HTML, извлечение основного контента, структурированная выборка через OpenAI-compatible Chat Completions API, сохранение в Markdown, фоновая обработка через очередь.

## Core Principles

### 1. Never Write Code Without a Contract
Before generating or editing any module, create or update its file-level MODULE_CONTRACT.

### 2. Semantic Markup Is Load-Bearing Structure
Semantic blocks must be uniquely named and paired (`rules/grace-code-markup.md`).

### 3. Knowledge Graph Is Always Current
`docs/knowledge-graph.xml` is the project map.

### 4. Verification Is a First-Class Artifact
`docs/verification-plan.xml` carries scenarios and stable log markers; see `rules/grace-logging.md`.

### 5. Top-Down Synthesis
`RequirementsAnalysis -> TechnologyStack -> DevelopmentPlan -> VerificationPlan -> Code + Tests`

### 6. Governed Autonomy
Contracts, plans, graph references define the allowed space.

## Logging and Trace Convention
```
logger.info("[Module][function][BLOCK_NAME] message", { correlationId, outcome: "..." })
```

See `rules/grace-logging.md` for branching observability.

## File Structure
```
docs/
  requirements.xml       - Product requirements and use cases
  technology.xml         - Stack decisions
  development-plan.xml   - Modules, phases, data flows
  verification-plan.xml  - Tests and markers
  knowledge-graph.xml    - Navigation graph
  operational-packets.xml
packages/core/           - Domain (fetch, extract, AI, markdown, orchestrator)
apps/api/                - HTTP API + enqueue
apps/worker/             - BullMQ consumer
apps/web/                - React UI (Vite)
```
