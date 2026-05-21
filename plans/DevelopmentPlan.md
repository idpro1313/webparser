$START_DEV_PLAN

**PURPOSE:** Парсер одной веб-страницы: fetch → extract → LLM summary → Markdown. **Версия:** `VERSION` (0.2.x).

**Стек:** Node 22, TypeScript 5.7, Fastify 4, BullMQ/ioredis, React 18 + Vite 6, vitest, pino, node-html-parser.

**Архитектура:** монорепо — `packages/core` (домен), `apps/api` (очередь), `apps/worker`, `apps/web`. Docker Compose.

**Non-goal v1:** multi-tenant SaaS, полный краулинг сайта.

**Риски:** внешние сети и LLM недетерминированы — таймауты и явные outcome-ветви.

**Для людей:** `docs/README.md`, корневой `README.md` (API).

---

## Модули

### Layer 0 — config & logging

| M-* | Путь | Назначение |
|-----|------|------------|
| M-CONFIG | `packages/core/src/config.ts` | Env: Redis, OUTPUT_DIR, OpenAI-compatible |
| M-LOGGER | `packages/core/src/logger.ts` | Структурные логи, jobId/correlationId |

### Layer 1 — pipeline

| M-* | Путь | Назначение |
|-----|------|------------|
| M-WEBSITE-FETCHER | `packages/core/src/website-fetcher.ts` | HTTP GET, timeout, size limit |
| M-CONTENT-EXTRACTOR | `packages/core/src/content-extractor.ts` | Title, body, metadata |
| M-AI-ADAPTER | `packages/core/src/ai-adapter.ts` | Chat completions → JSON выжимка |
| M-MARKDOWN-EXPORTER | `packages/core/src/markdown-exporter.ts` | index.md, pages/*.md |

### Layer 2 — orchestration & queue

| M-* | Путь | Назначение |
|-----|------|------------|
| M-JOB-ORCHESTRATOR | `packages/core/src/orchestrator.ts` | runParseJob, без ложного success |
| M-JOB-QUEUE | `apps/api/src/queue.ts` | BullMQ enqueue |

### Layer 3 — surfaces

| M-* | Путь | Назначение |
|-----|------|------------|
| M-HTTP-API | `apps/api/src/index.ts` | /api/health, /ready, jobs CRUD |
| M-WORKER-ENTRY | `apps/worker/src/index.ts` | BullMQ consumer → orchestrator |
| M-WEB-UI | `apps/web/src/` | Форма URL, статус job |

---

## Data flow DF-001 (ParseSingleUrl)

1. POST /api/jobs — валидация URL.
2. BullMQ job (jobId = correlationId).
3. Worker: fetch → extract (sufficient|insufficient) → AI → export.
4. GET /api/jobs/:id, GET .../files — статус и MD.

---

## Phases (implemented)

| Phase | Goal | Status |
|-------|------|--------|
| Phase-1 | config, logger, extract, markdown + tests | done |
| Phase-2 | fetch, AI, orchestrator + tests | done |
| Phase-3 | queue, API, worker, React UI | done |

---

### 1. Draft Code Graph

См. **`plans/AppGraph.xml`**.

```xml
<DraftCodeGraph>
  <apps_api_index_ts FILE="apps/api/src/index.ts" TYPE="ENTRY_POINT">
    <CrossLinks>
      <Link TARGET="apps_api_queue_ts" TYPE="ENQUEUES" />
      <Link TARGET="packages_core_config_ts" TYPE="CONFIG" />
    </CrossLinks>
  </apps_api_index_ts>
  <apps_worker_index_ts FILE="apps/worker/src/index.ts" TYPE="ENTRY_POINT">
    <CrossLinks>
      <Link TARGET="packages_core_orchestrator_ts" TYPE="RUNS" />
    </CrossLinks>
  </apps_worker_index_ts>
  <packages_core_orchestrator_ts FILE="packages/core/src/orchestrator.ts" TYPE="ORCHESTRATION">
    <CrossLinks>
      <Link TARGET="packages_core_website_fetcher_ts" TYPE="FETCH" />
      <Link TARGET="packages_core_content_extractor_ts" TYPE="EXTRACT" />
      <Link TARGET="packages_core_ai_adapter_ts" TYPE="AI" />
      <Link TARGET="packages_core_markdown_exporter_ts" TYPE="EXPORT" />
    </CrossLinks>
  </packages_core_orchestrator_ts>
</DraftCodeGraph>
```

---

### 2. Step-by-step Data Flow

1. UI/API: URL → очередь.
2. Worker вызывает `runParseJob` с лог-маркерами BLOCK_*.
3. Результат на диске `OUTPUT_DIR/<jobId>/`.
4. Core тестируется без Redis (`npm run test -w @webparser/core`).

---

### 3. Acceptance Criteria

- [ ] Новый модуль: контракт в этом файле + узел в AppGraph + V-M-* в `tests/test_guide.md`.
- [ ] Секреты не в логах и ответах API.
- [ ] `docs/README.md` при новых маршрутах.

$END_DEV_PLAN
