# Parcours — 歩み

Track job applications and build a personal interview question bank. Each application links to its interviews, and each interview links to the questions you encountered. Before a new interview at a similar company, pull up what you ran into last time.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui, TanStack Query v5 |
| Backend | Hono on Node.js (TypeScript) |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis |
| Auth | JWT — 15-min access token, 7-day refresh token |
| Logging | Pino with trace IDs (API), Sentry (web) |
| Container | Docker Compose |
| CI/CD | GitHub Actions |
| Tests | Vitest (unit), Supertest (API), Playwright (E2E) |
| Monorepo | Turborepo + pnpm workspaces |

## Project Layout

```
apps/
  web/        Next.js frontend
  api/        Hono backend
packages/
  shared/     Zod schemas and TypeScript types shared between web and api
docker/
  postgres/   Init scripts
  redis/      Config
.github/
  workflows/  CI pipeline
```

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker and Docker Compose

## Local Setup

```bash
# Install dependencies
pnpm install

# Copy env template
cp .env.example .env
# Fill in values before continuing

# Start Postgres and Redis
docker compose up -d postgres redis

# Run database migrations
pnpm --filter api db:migrate

# Start all services in watch mode
pnpm dev
```

Web: `http://localhost:3000`
API: `http://localhost:4000`
Swagger UI: `http://localhost:4000/docs`

## Full Stack via Docker

```bash
docker compose up
```

Builds and starts web, api, postgres, and redis together.

## Tests

```bash
# Unit tests (all packages)
pnpm test

# API integration tests
pnpm --filter api test:api

# E2E tests — requires a running stack
pnpm test:e2e
```

All three tiers run in CI on every push to `main` and on every pull request.

## Database Migrations

```bash
# Generate migration from schema changes
pnpm --filter api db:generate

# Apply pending migrations
pnpm --filter api db:migrate

# Open Drizzle Studio
pnpm --filter api db:studio
```

## Environment Variables

All required variables are in `.env.example`. The API validates the full environment at startup using Zod — it will not start if any required variable is missing or malformed.
