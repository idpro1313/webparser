# Документация проекта

> Для агентов карта — **plans/** (Grace 2). Этот файл — для людей.

## Обзор

**webparser** — парсер веб-страниц: загрузка HTML, извлечение основного текста, выжимка через **OpenAI-compatible** Chat Completions API, сохранение в **Markdown**. Монорепо: core, API, worker, web UI.

## Стек

- **packages/core** — fetch, extract, AI, markdown, orchestrator
- **apps/api** — Fastify, BullMQ
- **apps/worker** — обработка очереди
- **apps/web** — React (Vite)
- **Деплой:** Docker Compose (`docker-compose.yml`, `scripts/docker-start.ps1`)

## Структура репозитория

| Путь | Назначение |
|------|------------|
| `packages/core/` | Доменная логика |
| `apps/api/`, `apps/worker/`, `apps/web/` | Сервисы |
| `docs/` | `README.md`, `HISTORY.md` |
| `plans/` | Grace 2: `DevelopmentPlan.md`, `AppGraph.xml`, `business_requirements.md` |
| `tests/` | `test_guide.md` — V-M-*, VF-* |
| `work/` | Вспомогательные артефакты агента (отчёты, черновики); **не в git** |
| `.cursor/`, `.kilocode/` | Grace 2 rules и skills |

## Версия

Файл **`VERSION`** в корне (SemVer).

## Правила агента

- **Grace 2:** `.cursor/rules/grace-2-framework.mdc`, `.kilocode/rules/rules.md`; skills `mode-*`.
- **Ops:** `.cursor/rules/agent-rules.mdc` — `docs/HISTORY.md`, **`plans/`**, **`VERSION`**, subject **`X.Y.Z: описание`**; PowerShell для скриптов в репозитории.

