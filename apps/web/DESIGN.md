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
  └─ (app) group — /dashboard, /applications, /applications/[id], /questions, /watchlist
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
        applications/[id]/page.tsx  detail page — edit form, interview panel
        questions/page.tsx
        watchlist/page.tsx
    components/
      providers.tsx         QueryClientProvider wrapper
      nav-sidebar.tsx       left navigation
      applications/
        kanban-board.tsx    columns by status, ApplicationCard per item — cards navigate to /applications/[id]
        application-card.tsx
        application-detail.tsx  edit form + delete for a single application
        interview-panel.tsx     interview list with add/edit/delete modals
      questions/
        questions-list.tsx  question bank table + create form
      watchlist/
        watchlist-list.tsx  watchlist cards + create form
    hooks/
      use-applications.ts   GET /api/applications (list + single) + create/update/delete
      use-dashboard.ts      GET /api/dashboard
      use-interviews.ts     GET/POST/PATCH/DELETE /api/applications/:id/interviews
      use-questions.ts      GET/POST/PATCH/DELETE /api/questions
      use-watchlist.ts      GET/POST/PATCH/DELETE /api/watchlist + apply + analyze
    lib/
      api.ts                typed apiFetch wrapper
      types.ts              local TypeScript types matching actual API response shapes
```

> Coding rules for the frontend are in [`CODING.md`](../../CODING.md) at the repo root. The decisions below explain _why_ the architecture is the way it is; the coding rules explain _how_ to write code within it.

## Key Decisions

### 1. Pure client-side data fetching — no RSC fetch

All API calls go through TanStack Query v5 hooks in client components. No `fetch` inside Server Components or `use server` actions.

Reason: the API uses httpOnly cookies for auth. Next.js Server Components run on the server and cannot forward httpOnly cookies set by the browser — the `Cookie` header is not automatically included in RSC fetch. Client components with `credentials: 'include'` work correctly because the browser attaches cookies itself.

### 2. `proxy.ts` instead of `middleware.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function from `middleware()` to `proxy()`. The file at `src/middleware.ts` would be silently ignored in Next.js 16 — never create it.

The auth guard reads the `access_token` cookie. It only checks for the cookie's presence, not its validity — the API validates the JWT on every request and returns 401 if expired.

### 3. `apiFetch` with 401 → token refresh → login redirect

`lib/api.ts` exports a typed `apiFetch<T>()` that wraps `fetch` with `credentials: 'include'`. On 401, it calls `POST /api/auth/refresh` once. If the refresh succeeds it retries the original request transparently. If it fails it redirects to `/login`.

### 4. Tailwind v4 — no config file

Styles use `@import "tailwindcss"` in `globals.css` and CSS custom properties for theming. There is no `tailwind.config.js` or `tailwind.config.ts`. Tailwind v4 reads content paths automatically.

### 5. Hand-written UI components — no component library

No shadcn/ui, no Radix, no MUI. All UI is built directly with Tailwind classes. This keeps the bundle small and avoids version-lock to an upstream design system.

### 6. Local `types.ts` — not imported from `@parcours/shared`

`src/lib/types.ts` defines TypeScript types that match what the API actually returns. They are intentionally trimmed: fields not returned by API response schemas are absent. The shared package is used by form resolvers (`zodResolver(CreateApplicationSchema)`) but not for API response typing — those are narrower.

### 7. Flat ESLint config for Next.js 16 + ESLint 9

`eslint-config-next` v16 ships as a CJS flat config array. Loading it from an ESM `.mjs` file requires `createRequire` from the Node.js `module` built-in. Do not use `FlatCompat` — it wraps the already-flat config and creates a circular JSON structure.

```mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const nextConfig = require("eslint-config-next");
export default [...nextConfig];
```

## Pages

| Route                | Component                          | Data                                     |
| -------------------- | ---------------------------------- | ---------------------------------------- |
| `/`                  | `app/page.tsx`                     | redirect → `/applications`               |
| `/login`             | `(auth)/login/page.tsx`            | `POST /api/auth/login`                   |
| `/register`          | `(auth)/register/page.tsx`         | `POST /api/auth/register`                |
| `/dashboard`         | `(app)/dashboard/page.tsx`         | `GET /api/dashboard`                     |
| `/applications`      | `(app)/applications/page.tsx`      | `GET /api/applications`                  |
| `/applications/[id]` | `(app)/applications/[id]/page.tsx` | `GET /api/applications/:id` + interviews |
| `/questions`         | `(app)/questions/page.tsx`         | `GET /api/questions`                     |
| `/watchlist`         | `(app)/watchlist/page.tsx`         | `GET /api/watchlist`                     |

## TODO

- [x] **Token refresh in `apiFetch`** — on 401, calls `POST /api/auth/refresh` once; if it succeeds retries the original request; if it fails redirects to `/login`. Implemented in `src/lib/api.ts`.

- [x] **Application detail page** `/applications/[id]` — edit form (company, role, status with valid transitions, salary, notes, jd_url), soft-delete button, interview list (add/edit/delete, set outcome). Kanban cards now navigate to the detail page. Linked questions panel is still deferred — no `GET /api/applications/:id/questions` endpoint exists yet.

- [x] **Application PATCH + DELETE** — `useUpdateApplication` and `useDeleteApplication` are wired to the detail page. `useUpdateApplication` now also accepts `jdUrl` and sets query data on success to avoid a redundant refetch.

- [x] **E2E test infrastructure** — Playwright config, `@playwright/test` dependency, and 4 auth smoke tests in `e2e/auth.spec.ts` (redirect guard, page renders, register→login flow). Full flow tests (add interview, update status) pending.

- [x] **Toast feedback on mutation errors** — all `useMutation` calls in `use-applications.ts`, `use-interviews.ts`, `use-questions.ts`, and `use-watchlist.ts` have `onError: (err) => toast.error(err.message)`. A global error boundary is still missing.

- [x] **Question edit + delete** — inline edit/delete buttons on each question row; delete requires two-step confirmation. Shared `QuestionModal` handles both add and edit via `defaultValues`. Hooks: `useUpdateQuestion` (PATCH), `useDeleteQuestion` (DELETE).

- [x] **Watchlist edit + apply + AI analysis** — edit modal with pre-filled fields; apply button (POST /:id/apply → creates application, redirects to detail page); analyze button consumes SSE stream, shows spinner, invalidates cache on completion, renders collapsible FitAnalysis panel (score, skill match, salary fit, highlights, concerns).

- [x] **API integration tests** — Vitest integration suite covering auth (register/login/logout), applications (CRUD + status transitions), interviews (CRUD), questions (CRUD), watchlist (CRUD + apply). Each suite uses an isolated user and cleans up in `afterAll`. `vitest.integration.config.ts` auto-loads `../../.env` if present; CI uses job-level env vars.

- [x] **jdText field** — `UpdateApplicationSchema` now accepts `jdText`; application detail form has a "Job description" textarea. Watchlist edit modal also has a "Job description (for AI analysis)" textarea; `useUpdateWatchlist` passes `jdText` in the PATCH payload.

- [x] **Linked questions panel** on the detail page — `GET /:id/questions` and `DELETE /:id/questions/:questionId` in `applications.ts`; `POST /questions/:id/link` in `questions.ts`. Component rendered in `/applications/[id]`.

- [ ] **Pagination** — list endpoints support `page` + `limit` but the UI always fetches page 1. Add controls after the detail page stabilises.
