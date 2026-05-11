# Parcours

Track job applications and build a personal interview question bank. Each application links to its interviews, and each interview links to the questions you encountered. Before a new interview at a similar company, pull up what you ran into last time.

## Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | Next.js (App Router), Tailwind CSS, TanStack Query v5 |
| Backend   | Hono on Node.js (TypeScript)                          |
| Database  | PostgreSQL + Drizzle ORM                              |
| Cache     | Redis                                                 |
| Auth      | JWT — 15-min access token, 7-day refresh token        |
| Logging   | Pino with trace IDs (API), Sentry (web)               |
| Container | Docker Compose                                        |
| CI/CD     | GitHub Actions                                        |
| Tests     | Vitest (unit), Supertest (API), Playwright (E2E)      |
| Monorepo  | Turborepo + pnpm workspaces                           |

## Project Layout

```
apps/
  web/        Next.js frontend
  api/        Hono backend
packages/
  shared/     Zod schemas and TypeScript types shared between web and api
docker/
  postgres/   Init scripts
.github/
  workflows/  CI pipeline
```

## Prerequisites

- Node.js 22
- pnpm 9+
- Docker and Docker Compose

## Local Setup

```bash
make setup   # copies .env, installs deps, starts Docker, runs migrations
make dev     # starts postgres + redis, then all services in watch mode
```

Web: `http://localhost:3000`
API: `http://localhost:4000`
Swagger UI: `http://localhost:4000/docs`

Copy `.env.example` to `.env` and fill in values before running `make setup`.

## Common Commands

```bash
make dev          # start postgres + redis, then run all services
make migrate      # apply pending DB migrations
make db-studio    # open Drizzle Studio
make down         # stop all Docker services
make check        # format + lint + typecheck + test + build (run before pushing)
```

For package-level tasks:

```bash
pnpm --filter api db:generate   # generate migration from schema changes
pnpm --filter api test:api      # API integration tests
pnpm test:e2e                   # E2E tests (requires running stack)
```

## Full Stack via Docker

```bash
docker compose up
```

Builds and starts web, api, postgres, and redis together. Migrations run automatically before the API container starts.

## Tests

```bash
pnpm test                    # unit tests (all packages)
pnpm --filter api test:api   # API integration tests
pnpm test:e2e                # E2E tests — requires a running stack
```

All three tiers run in CI on every push to `main` and on every pull request.

## Environment Variables

All required variables are in `.env.example`. The API validates the full environment at startup using Zod — it will not start if any required variable is missing or malformed.
