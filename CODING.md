# Coding Rules

Rules that apply across the entire monorepo. Read before writing new code.

## Formatting and linting

- **Run `pnpm format` before every commit.** Prettier is the canonical formatter — no style debates. The script runs on `**/*.{ts,tsx,md,json}` and edits files in place.
- **ESLint errors block commits.** Fix them before pushing. Warnings are acceptable but should be addressed before a PR is merged. The CI `lint` job fails on any error.
- **`pnpm lint && pnpm typecheck && pnpm test` must all pass** before pushing. See the full pre-push sequence in CLAUDE.md.

## TypeScript

- No `any`. If the shape is truly unknown, use `unknown` and narrow it explicitly.
- No non-null assertions (`!`) unless you add a comment stating why null is impossible at that point.
- Explicit return types on all exported functions. Inferred return types are fine for unexported helpers.
- Do not widen types to work around a type error. Fix the underlying issue.

## API (`apps/api`)

- **All request validation goes through the route's Zod schema.** Never read from a raw request body without parsing. The schema is defined in the `createRoute()` call; use `c.req.valid('json')` to get the parsed value.
- **No `console.log`.** Use the Pino logger. In route handlers, get the logger from context; in middleware, import from `src/lib/logger.ts` (or wherever the singleton lives).
- **Every log line must include `traceId`.** Get it from `c.get('traceId')`. Never generate a new trace ID mid-request.
- **No raw SQL.** All DB access goes through Drizzle. No `db.execute(sql\`...\`)` workarounds except in migrations.
- **Soft delete only.** Set `deleted_at = now()` via Drizzle. Never issue a `DELETE` statement on user data tables.
- **Status transitions are enforced server-side.** The `STATUS_TRANSITIONS` map from `@parcours/shared` must be checked on every PATCH to `applications`. Invalid transitions return 400.
- No business logic in middleware. Middleware handles cross-cutting concerns (auth, rate limiting, logging). Route handlers own business logic.

## Frontend (`apps/web`)

- **No `useEffect` for data fetching.** Use TanStack Query (`useQuery` for reads, `useMutation` for writes). Direct `useEffect`+`fetch` patterns bypass caching, deduplication, and error handling.
- **All API calls go through `apiFetch` in `src/lib/api.ts`.** Never call `fetch` directly in a component or hook. `apiFetch` handles credentials, token refresh on 401, and typed errors.
- **No RSC data fetching.** Every page that needs server state is a Client Component (`'use client'`). httpOnly cookies cannot be forwarded through RSC — see CLAUDE.md for details.
- **Mutation errors must surface to the user.** Use `sonner` toast in `onError` of `useMutation`. Do not silently swallow errors.
- **No inline styles for layout.** Use Tailwind classes. Inline `style={{}}` is acceptable only for dynamic values that cannot be expressed as Tailwind classes (e.g. a CSS custom property derived from a runtime value).
- Hooks live in `src/hooks/`. Each hook file owns one domain (applications, questions, watchlist, etc.). Do not put query/mutation logic directly in page or component files.

## Shared (`packages/shared`)

- All request/response shapes that are used by more than one package live here as Zod schemas. Never duplicate types between `apps/api` and `apps/web`.
- All imports inside `packages/shared/src/` — re-exports in `index.ts` and imports between schema files — must be extensionless (`./application`, not `./application.js` or `./application.ts`). Turbopack does not remap `.js` → `.ts` for workspace source files; an explicit `.js` extension passes tsc but fails `next build`.
- Inferred TypeScript types (`z.infer<typeof FooSchema>`) are exported alongside every schema. Consumers import the type, not the schema, when they only need the type.

## General

- **No hardcoded secrets or URLs.** All configuration comes from environment variables validated by `apps/api/src/env.ts` (API) or `NEXT_PUBLIC_*` vars (web).
- **No commented-out code in commits.** Delete it. Git history preserves it if you need it back.
- **One concern per PR.** A PR that fixes a bug should not also refactor unrelated files. If cleanup is needed, open a separate PR.
