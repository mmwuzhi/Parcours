# Parcours

Job application tracker and interview question bank. Monorepo with a Next.js frontend and a Hono API backend sharing Zod schemas via a `packages/shared` package.

## Tech Stack

- Monorepo: Turborepo + pnpm workspaces
- Frontend: Next.js (App Router, RSC), Tailwind CSS, shadcn/ui, TanStack Query v5
- Backend: Hono on Node.js, TypeScript
- Database: PostgreSQL + Drizzle ORM (migrations in `apps/api/src/db/migrations/`)
- Cache: Redis (dashboard aggregations + rate limit counters)
- Auth: JWT — access token 15 min, refresh token 7 days, stored in httpOnly cookies
- Logging: Pino structured JSON with `traceId` on every log line (API); Sentry on the web
- Tests: Vitest (unit), Supertest (API), Playwright (E2E)
- Container: Docker Compose — `docker compose up` starts the full stack

## Key Paths

- `apps/web/` — Next.js app
- `apps/api/` — Hono server, entry at `src/index.ts`
- `packages/shared/` — Zod schemas, inferred TypeScript types, shared constants
- `apps/api/src/db/schema.ts` — Drizzle schema (source of truth for data model)
- `apps/api/src/db/migrations/` — generated migration files, never edit by hand
- `apps/api/src/middleware/` — trace-id, auth guard, rate limiter, request logger
- `.env.example` — all required env vars; validated at startup by `apps/api/src/env.ts`

## Data Model

```
users              id, email, password_hash, created_at
applications       id, user_id, company, role, status, salary_range, jd_url, jd_text, notes, applied_at, created_at, deleted_at
interviews         id, application_id, type, scheduled_at, outcome, notes, created_at, deleted_at
questions          id, user_id, content, answer, tags[], difficulty, source_company, review_count, next_review_at, created_at, deleted_at
application_questions  application_id, question_id, linked_at  (join table)
watchlist          id, user_id, company, role, jd_url, jd_text, salary_range, tags[], notes, fit_analysis (jsonb), analyzed_at, created_at, deleted_at
```

Application status flow: `APPLIED → PHONE → TECHNICAL → ONSITE → OFFER → ACCEPTED` — can move to `REJECTED` or `WITHDRAWN` from any state.

## Common Commands

```bash
# First-time local setup
docker compose up -d postgres redis
cp .env.example .env              # then fill in AI_API_KEY and secrets
pnpm --filter api db:migrate      # apply migrations to local DB
pnpm dev                          # start all apps in watch mode

# Daily dev
pnpm dev                          # start all apps in watch mode
pnpm test                         # unit tests across all packages
pnpm --filter api test:api        # API integration tests
pnpm test:e2e                     # Playwright E2E (requires running stack)
pnpm --filter api db:generate     # generate Drizzle migration from schema changes
pnpm --filter api db:migrate      # apply pending migrations
pnpm --filter api db:studio       # open Drizzle Studio
docker compose up                 # full stack in Docker
docker compose up -d postgres redis  # just the data layer
```

> **Note:** `pnpm --filter api build` (tsup) requires Node 22. On Node 25 the esbuild binary is incompatible. Use `pnpm dev` (tsx) for local development; the Docker build uses Node 22 and works correctly.

## Conventions

- All shared request/response shapes live in `packages/shared` as Zod schemas. Never duplicate types between web and api.
- Every API route exports an OpenAPI spec via `@hono/zod-openapi`. Swagger UI auto-generates from these.
- Every log line from the API includes a `traceId`. The web app sends this same ID to Sentry so frontend errors map to backend logs.
- Soft-delete only — no hard deletes. All tables with user data have a `deleted_at` column.
- Migrations are generated, never hand-written. Run `db:generate` after schema changes.
- Rate limiting runs as middleware before auth. Limits are per-IP for public routes, per-user for authenticated routes.
- AI analysis (watchlist fit analysis) is provider-agnostic via Vercel AI SDK. Provider is selected by `AI_PROVIDER` env var. Supported: `openai`, `anthropic`, `google`, `groq`, `mistral`, `deepseek`. Any OpenAI-compatible endpoint works via `AI_BASE_URL`.
- **Run `/check` before every `git push`.** Fix all hard stops before pushing; gated fixes require explicit approval.

## Environment

Copy `.env.example` to `.env` before running anything. The API reads env vars through `apps/api/src/env.ts`, which uses Zod to validate and parse all values at startup.
