#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.docker ]]; then
  if [[ ! -f .env.docker.example ]]; then
    echo "Missing .env.docker.example" >&2
    exit 1
  fi
  cp .env.docker.example .env.docker
  echo "[docker-start] Created .env.docker from .env.docker.example — set OPENAI_API_KEY" >&2
fi

docker compose up -d --build "$@"
echo "[docker-start] UI: http://localhost:8080  (proxies /api → api)"
