# apps/web — Design Document

## Architecture Overview

```
Browser
  │
  ├─ proxy.ts (Next.js 16 auth guard)
  │     reads access_token cookie (httpOnly, set by API)
  │     unauthenticated → redirect /login
  │     authenticated on public route → redirect /applications
  │
  ├─ (auth) group — /login, /register
  │     no layout wrapping; public routes
  │
  └─ (app) group — /dashboard, /applications, /questions, /watchlist
        shared nav-sidebar layout
        TanStack Query v5 for all server state
        apiFetch() for all API calls (credentials: 'include')
```

## File Structure

```
apps/web/
  package.json
  tsconfig.json
  eslint.config.mjs         flat ESLint config — loads eslint-config-next via createRequire
  postcss.config.mjs        Tailwind v4 via @tailwindcss/postcss
  src/
    proxy.ts                Next.js 16 auth guard (renamed from middleware.ts)
    app/
      layout.tsx            root layout — QueryClientProvider + global CSS
      page.tsx              / → redirect to /applications
      (auth)/
        login/page.tsx
        register/page.tsx
      (app)/
        layout.tsx          app shell with nav-sidebar
        dashboard/page.tsx
        applications/page.tsx
        questions/page.tsx
        watchlist/page.tsx
    components/
      providers.tsx         QueryClientProvider wrapper
      nav-sidebar.tsx       left navigation
      applications/
        kanban-board.tsx    columns by status, ApplicationCard per item
        application-card.tsx
      questions/
        questions-list.tsx  question bank table + create form
      watchlist/
        watchlist-list.tsx  watchlist cards + create form
    hooks/
      use-applications.ts   GET /api/applications (list + create)
      use-dashboard.ts      GET /api/dashboard
      use-questions.ts      GET /api/questions (list + create)
      use-watchlist.ts      GET /api/watchlist (list + create)
    lib/
      api.ts                typed apiFetch wrapper
      types.ts              local TypeScript types matching actual API response shapes
```

> Coding rules for the frontend are in [`CODING.md`](../../CODING.md) at the repo root. The decisions below explain *why* the architecture is the way it is; the coding rules explain *how* to write code within it.

## Key Decisions

### 1. Pure client-side data fetching — no RSC fetch

All API calls go through TanStack Query v5 hooks in client components. No `fetch` inside Server Components or `use server` actions.

Reason: the API uses httpOnly cookies for auth. Next.js Server Components run on the server and cannot forward httpOnly cookies set by the browser — the `Cookie` header is not automatically included in RSC fetch. Client components with `credentials: 'include'` work correctly because the browser attaches cookies itself.

### 2. `proxy.ts` instead of `middleware.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function from `middleware()` to `proxy()`. The file at `src/middleware.ts` would be silently ignored in Next.js 16 — never create it.

The auth guard reads the `access_token` cookie. It only checks for the cookie's presence, not its validity — the API validates the JWT on every request and returns 401 if expired.

### 3. `apiFetch` with 401 → login redirect (no refresh yet)

`lib/api.ts` exports a typed `apiFetch<T>()` that wraps `fetch` with `credentials: 'include'`. On 401, it redirects to `/login`. Token refresh is not yet implemented — see TODO below.

### 4. Tailwind v4 — no config file

Styles use `@import "tailwindcss"` in `globals.css` and CSS custom properties for theming. There is no `tailwind.config.js` or `tailwind.config.ts`. Tailwind v4 reads content paths automatically.

### 5. Hand-written UI components — no component library

No shadcn/ui, no Radix, no MUI. All UI is built directly with Tailwind classes. This keeps the bundle small and avoids version-lock to an upstream design system.

### 6. Local `types.ts` — not imported from `@parcours/shared`

`src/lib/types.ts` defines TypeScript types that match what the API actually returns. They are intentionally trimmed: fields not returned by API response schemas are absent. The shared package is used by form resolvers (`zodResolver(CreateApplicationSchema)`) but not for API response typing — those are narrower.

### 7. Flat ESLint config for Next.js 16 + ESLint 9

`eslint-config-next` v16 ships as a CJS flat config array. Loading it from an ESM `.mjs` file requires `createRequire` from the Node.js `module` built-in. Do not use `FlatCompat` — it wraps the already-flat config and creates a circular JSON structure.

```mjs
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const nextConfig = require('eslint-config-next')
export default [...nextConfig]
```

## Pages

| Route | Component | Data |
|-------|-----------|------|
| `/` | `app/page.tsx` | redirect → `/applications` |
| `/login` | `(auth)/login/page.tsx` | `POST /api/auth/login` |
| `/register` | `(auth)/register/page.tsx` | `POST /api/auth/register` |
| `/dashboard` | `(app)/dashboard/page.tsx` | `GET /api/dashboard` |
| `/applications` | `(app)/applications/page.tsx` | `GET /api/applications` |
| `/questions` | `(app)/questions/page.tsx` | `GET /api/questions` |
| `/watchlist` | `(app)/watchlist/page.tsx` | `GET /api/watchlist` |

## TODO

Items not yet implemented. Token refresh must happen before anything else — the 15-minute access token window makes any longer session unusable.

- [x] **Token refresh in `apiFetch`** — on 401, calls `POST /api/auth/refresh` once; if it succeeds retries the original request; if it fails redirects to `/login`. Implemented in `src/lib/api.ts`.

- [ ] **Application detail page** `/applications/[id]` — edit form (company, role, status with valid transitions, salary, notes, jd_url), soft-delete button, interview list (add/edit/delete, set outcome), linked questions panel (link/unlink from question bank). All API routes exist; this is ~8 new files.

- [ ] **Watchlist AI streaming analysis** — "Analyze fit" button on each watchlist card that calls `POST /api/watchlist/:id/analyze`, reads the SSE stream chunk-by-chunk, and renders the structured result (`FitAnalysisSchema`: score, skills match, recommendation). Independent of the detail page.

- [ ] **Question full CRUD** — edit question (content, answer, difficulty, tags), delete question, spaced repetition review queue (questions where `next_review_at <= now`).

- [ ] **Application PATCH + DELETE** — `useUpdateApplication` and `useDeleteApplication` hooks exist in `src/hooks/use-applications.ts` but no UI calls them yet. Wired up once the detail page exists.

- [x] **E2E test infrastructure** — Playwright config, `@playwright/test` dependency, and 4 auth smoke tests in `e2e/auth.spec.ts` (redirect guard, page renders, register→login flow). Full flow tests (add interview, update status) pending.

- [ ] **Error boundary + toast feedback** — TanStack Query mutation errors currently go unhandled in the UI. Add a global error boundary and a toast system (or inline error messages) so the user knows when a mutation failed.

- [ ] **Pagination** — list endpoints support `page` + `limit` query params but the UI fetches page 1 only. Add pagination controls once the detail page is done.
