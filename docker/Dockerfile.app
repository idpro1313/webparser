# syntax=docker/dockerfile:1

# Shared production runtime: builds core + api + worker workspaces.
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
COPY apps/web ./apps/web

RUN npm run build

FROM node:22-alpine AS app

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

COPY docker/api-healthcheck.cjs ./scripts/api-healthcheck.cjs

# Override in compose: api vs worker entrypoint.
CMD ["node", "apps/api/dist/index.js"]
