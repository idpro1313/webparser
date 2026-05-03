# webparser

Умный парсер веб-страниц: загрузка HTML, извлечение основного текста, структурированная выжимка через **OpenAI-compatible** Chat Completions API, сохранение в **Markdown**. GRACE-артефакты в `docs/`.

## Архитектура

- `packages/core` — доменная логика (fetch, extract, AI, markdown, orchestrator)
- `apps/api` — Fastify HTTP API + постановка задач в BullMQ
- `apps/worker` — BullMQ worker, выполняет `runParseJob`
- `apps/web` — React UI (Vite)

## Быстрый старт (Docker — весь стек)

Требования: Docker с Compose V2 (`docker compose`).

1. Подготовьте [.env.docker](.env.docker) с **`OPENAI_API_KEY`**. Если файла нет, скрипт ниже один раз создаст его из [.env.docker.example](.env.docker.example).
2. Запуск:

   ```bash
   bash scripts/docker-start.sh
   ```

   PowerShell из корня репозитория:

   ```powershell
   .\scripts\docker-start.ps1
   ```

3. Откройте **http://localhost:8080** — статика из `apps/web` и прокси **`/api`** в контейнер API.

Сервис `api` в Compose считается **healthy**, когда внутри контейнера отвечает **GET `/api/ready`** (Redis доступен). Сервис `web` поднимается после здорового `api`.

Markdown по задачам пишется в volume **`webparser_output`** для сервисов `api` и `worker`. Чтобы видеть файлы прямо в каталоге репозитория, временно замените volume в [`docker-compose.yml`](docker-compose.yml) на `./docker-output:/data/output`.

Остановка: `docker compose down`.

---

## Локальная разработка (без приложения в Docker)

1. Поднимите Redis локально:

   ```bash
   docker run -d --name webparser-redis -p 6379:6379 redis:7-alpine
   ```

2. Скопируйте [.env.example](.env.example) → `.env` и задайте `OPENAI_API_KEY`, `REDIS_URL=redis://localhost:6379` и при необходимости другие переменные.

3. Установить зависимости:

   ```bash
   npm install
   ```

4. Собрать core:

   ```bash
   npm run build -w @webparser/core
   ```

5. В трёх терминалах:

   ```bash
   npm run dev:api
   npm run dev:worker
   npm run dev:web
   ```

Откройте UI (обычно `http://localhost:5173`), API — `http://localhost:3000`.

## HTTP API

- `GET /api/health` — живость процесса API (`200`, `{ ok, service }`)
- `GET /api/ready` — готовность (Redis `PING`), при проблемах `503` и `{ ok: false, redis: false }`
- `POST /api/jobs` — body `{ "url": "https://example.com" }` → `{ jobId }`
- `GET /api/jobs/:id` — состояние BullMQ job (`state`, `returnvalue`, `failedReason`)
- `GET /api/jobs/:id/files` — список сохранённых файлов задачи под `OUTPUT_DIR/<jobId>/`

## Документы GRACE

- [`docs/requirements.xml`](docs/requirements.xml)
- [`docs/technology.xml`](docs/technology.xml)
- [`docs/development-plan.xml`](docs/development-plan.xml)
- [`docs/verification-plan.xml`](docs/verification-plan.xml)
- [`docs/knowledge-graph.xml`](docs/knowledge-graph.xml)

## Тесты

```bash
npm test
```
