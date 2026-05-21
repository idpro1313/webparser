# Test guide — webparser (mode-qa)

## Политика

- Логи: `[Module][function][BLOCK_NAME] message`
- Strict LDD на fetch, LLM, export — маркеры BLOCK_* в логах worker/core
- Сначала **vitest** в `@webparser/core`; без Redis для unit.
- Не логировать API keys.

## Команды

| Область | Команда |
|---------|---------|
| Core unit (Phase-1 gate) | `npm run test -w @webparser/core` |
| Отдельный модуль | `npm run test -w @webparser/core -- src/<file>.test.ts` |
| Build API types | `npm run build -w @webparser/api` |
| Smoke health | `GET /api/health` → 200 `{ ok }` |
| Smoke ready | `GET /api/ready` → 200 `redis:true` или 503 |

## Critical flows (VF-*)

| VF | UC | Ожидание |
|----|-----|----------|
| VF-001 HappyPath | UC-001–003 | Цепочка BLOCK_VALIDATE → FETCH success → EXTRACT sufficient → AI success → EXPORT success; index.md + pages/*.md |
| VF-002 RejectedUrl | UC-001 | HTTP 400 / rejected до enqueue |
| VF-003 FetchFailure | UC-003 | Job failed; нет EXPORT success после timeout/network |

## V-M-* → тесты

| Module | Test file | Log prefix |
|--------|-----------|------------|
| M-CONFIG | `packages/core/src/config.test.ts` | [Config] |
| M-LOGGER | — (smoke factory) | — |
| M-WEBSITE-FETCHER | `website-fetcher.test.ts` | [WebsiteFetcher] |
| M-CONTENT-EXTRACTOR | `content-extractor.test.ts` | [ContentExtractor] |
| M-AI-ADAPTER | `ai-adapter.test.ts` | [AiAdapter] |
| M-MARKDOWN-EXPORTER | `markdown-exporter.test.ts` | [MarkdownExporter] |
| M-JOB-ORCHESTRATOR | `orchestrator.test.ts` | [JobOrchestrator] |
| M-JOB-QUEUE | E2E manual (Redis + enqueue) | [JobQueueAdapter] |
| M-HTTP-API | smoke /api/health, /api/ready | [HttpApi] |
| M-WORKER-ENTRY | logs BLOCK_WORKER_JOB_* | [ParseWorker] |
| M-WEB-UI | form smoke | — |

## Phase gate

**Gate-Phase-1:** `npm run test -w @webparser/core` — все зелёные; маркеры V-M-* Phase-1 покрыты тестами.
