# Business requirements — webparser

## Project

**webparser** — умный парсер одной страницы: HTML → текст → LLM-выжимка → Markdown. Web UI, REST API, фоновая очередь.

**Keywords:** web-parser, openai-compatible, markdown, bullmq, extraction.

## Actors

- **User** — создаёт задачу, смотрит статус, получает MD.
- **System** — worker: fetch → extract → AI → export.

## Use cases

| UC | Actor | Goal | Flow |
|----|-------|------|------|
| UC-001 | User | Создать job по URL | DF-001 (enqueue) |
| UC-002 | User | Статус задачи | GET /api/jobs/:id |
| UC-003 | System | Конвейер парсинга | DF-001 |
| UC-004 | User | Получить MD-файлы | GET .../files после completed |

## Non-goals (v1)

- Краулинг сайта depth > 1.
- Multi-tenant SaaS, billing.
- LLM API кроме OpenAI-compatible Chat Completions.

## Constraints

- Секреты только в env; не в логах и ответах API.
- Критические ветви — log markers BLOCK_*.
- Redis + BullMQ; worker отдельно от API.

## Risks

- Таймауты и нестабильные сайты при fetch.
- Невалидный JSON от модели → `invalid_response`.

## Open questions

- Прокси / Basic auth для целевых сайтов?
