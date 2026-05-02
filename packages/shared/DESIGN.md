# packages/shared — Design Document

## Purpose

Single source of truth for all request/response shapes shared between `apps/api` and `apps/web`. Defined as Zod schemas so that both validation (API) and form handling (web) derive from the same definitions.

**Rule**: if a shape is used by more than one package, it lives here. No duplicating types between `api` and `web`.

## File Structure

```
packages/shared/
  package.json
  tsconfig.json
  src/
    schemas/
      auth.ts          register/login request bodies; token response shape
      application.ts   create/update/response shapes for applications
      interview.ts     create/update/response shapes for interviews
      question.ts      create/update/response shapes for questions; link payload
      dashboard.ts     dashboard response shape (stats + upcoming interviews)
    index.ts           re-exports all schemas and inferred TypeScript types
```

## Schema Conventions

Every schema file exports:

1. **Input schema** — used for request body validation (e.g. `CreateApplicationSchema`)
2. **Response schema** — used for API response typing (e.g. `ApplicationSchema`)
3. **Inferred TypeScript types** — derived with `z.infer<>` (e.g. `type Application = z.infer<typeof ApplicationSchema>`)

```ts
// example pattern
export const CreateApplicationSchema = z.object({ ... })
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>

export const ApplicationSchema = z.object({ ... })
export type Application = z.infer<typeof ApplicationSchema>
```

## Usage

### In `apps/api` (route definition)

```ts
import { CreateApplicationSchema, ApplicationSchema } from '@parcours/shared'

const route = createRoute({
  method: 'post',
  path: '/api/applications',
  request: { body: { content: { 'application/json': { schema: CreateApplicationSchema } } } },
  responses: { 201: { content: { 'application/json': { schema: ApplicationSchema } } } },
})
```

### In `apps/web` (form validation)

```ts
import { CreateApplicationSchema } from '@parcours/shared'

const form = useForm({ resolver: zodResolver(CreateApplicationSchema) })
```

## Schema Index

| File | Exports |
|------|---------|
| `auth.ts` | `RegisterSchema`, `LoginSchema`, `AuthResponseSchema` |
| `application.ts` | `CreateApplicationSchema`, `UpdateApplicationSchema`, `ApplicationSchema`, `ApplicationListSchema` |
| `interview.ts` | `CreateInterviewSchema`, `UpdateInterviewSchema`, `InterviewSchema` |
| `question.ts` | `CreateQuestionSchema`, `UpdateQuestionSchema`, `QuestionSchema`, `LinkQuestionSchema` |
| `watchlist.ts` | `CreateWatchlistSchema`, `UpdateWatchlistSchema`, `WatchlistSchema`, `FitAnalysisSchema` |
| `dashboard.ts` | `DashboardSchema` |

## Application Status Enum

Defined once here, used everywhere:

```ts
export const ApplicationStatus = z.enum([
  'APPLIED', 'PHONE', 'TECHNICAL', 'ONSITE', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
])
export type ApplicationStatus = z.infer<typeof ApplicationStatus>
```

Valid transitions: `APPLIED → PHONE → TECHNICAL → ONSITE → OFFER → ACCEPTED`. `REJECTED` and `WITHDRAWN` are reachable from any state. The API enforces no transition rules at this stage — any status value is accepted on PATCH.

## Interview Type Enum

```ts
export const InterviewType = z.enum([
  'phone_screen', 'technical', 'behavioral', 'system_design', 'onsite'
])
```

## FitAnalysis Shape

`FitAnalysisSchema` is the Zod schema for the JSONB stored in `watchlist.fit_analysis`. Defined here so both the API (writes it) and the web (reads and renders it) share the same type.

```ts
export const FitAnalysisSchema = z.object({
  provider:        z.string(),
  model:           z.string(),
  skills_match:    z.object({
    matched:  z.string().array(),
    partial:  z.string().array(),
    missing:  z.string().array(),
  }),
  salary_fit:      z.enum(['good', 'ok', 'low', 'unknown']),
  overall_score:   z.number().int().min(0).max(100),
  recommendation:  z.string(),
  concerns:        z.string().array(),
  highlights:      z.string().array(),
})
export type FitAnalysis = z.infer<typeof FitAnalysisSchema>
```

## TODO

- [ ] **OpenAPI type generation** — consider `zod-to-openapi` or Hono's built-in OpenAPI output to auto-generate a client SDK for `apps/web`, eliminating manual `fetch` calls entirely
- [ ] **Stricter status transition validation** — add a `validateTransition(from, to)` helper here so both API and web can check before submitting
- [ ] **Pagination schema** — standardize `{ data, total, page, limit }` envelope once pagination is added to list endpoints
