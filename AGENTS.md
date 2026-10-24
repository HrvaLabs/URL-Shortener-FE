# hrva.cc — URL Shortener Frontend

Next.js 16 App Router + React 19, deployed on Cloudflare Workers via `@opennextjs/cloudflare`. Deployed at [hrva.cc](https://hrva.cc).

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server (TurboPack) |
| `npm run build` | Standard Next.js build |
| `npm run build:cf` | Cloudflare Worker build |
| `npm run preview` | Build + Cloudflare local preview |
| `npm run deploy` | Build + Cloudflare deploy |
| `npm run cf-typegen` | Regenerate `cloudflare-env.d.ts` from wrangler config |
| `npm run lint` | ESLint (`eslint .`) |

No test framework is set up.

---

## API Docs (Swagger)

| Environment | Swagger UI | OpenAPI JSON |
|-------------|------------|--------------|
| Production  | `https://hrva.cc/swagger-ui/index.html` | `https://hrva.cc/v3/api-docs` |
| Local dev   | `http://localhost:8080/swagger-ui/index.html` | `http://localhost:8080/v3/api-docs` |

---

## Architecture

### Routing (`app/`)
- `/` — Landing page (public URL shorten + logged-in experience)
- `/login`, `/register`, `/reset-password/[token]` — Auth flows
- `/validate/[short]` — Peek at a URL before visiting
- `/fortune`, `/egg` — Easter eggs
- `/changelog` — Release notes (fetches from backend `/api/changelog`)
- `/unavailable?s=&reason=` — Where the backend sends a short link that can't redirect (`noindex`). `reason` is `blocked`, `expired`, `limit`, `inactive` or `missing`; anything else falls back to the `missing` line. "Report a link" carries `s` to `/report`
- `/report?s=` — Public report form: short link (prefilled from `s`), category, details. The link is reduced to its bare code (`hrva.cc/abc` → `abc`, host taken from `getShortBaseUrl()`) before `reportApi.report()`; a 429 shows the backend's text
- `/dashboard/*` — Protected; user's URLs, API keys, settings
  - `/dashboard/analytics` — Analytics overview: the all-time counters (links, active, expired, all-time visits), then for the range the totals, the clicks vs daily unique visitors trend and the top 10 links by clicks, each opening its own view with the same range. `?link={id}` shows one link (its owner or an admin): summary, range totals, the clicks vs daily unique visitors chart and the referrer, country, device, browser and OS breakdowns. `?days=7|30|90|365` picks the range (default 30, left out of the URL); anything else falls back to 30, and a `link` that isn't a positive integer shows the overview. The dashboard row's and All URLs' "View stats" open it
- `/admin/*` — Protected + `ROLE_ADMIN`
  - `/admin` — Users table. "Possible scammers only" sends `possibleScammer=true` (server-side filter); a Possible scammer badge comes from `user.possibleScammer`; Block / Unblock user each ask for confirmation and toast the number of links blocked or restored
  - `/admin/dashboard` — Stats, metrics, login rate limits
  - `/admin/urls` — All URLs with bulk actions (checkbox multi-select). Search matches short link, destination and owner email (a pasted `hrva.cc/abc` is reduced to `abc`); filters Active/Deactivated, Expired only, Anonymous only; Owner sorts by `owner.email`; a Suspicious badge shows the backend's `suspiciousReasons`. A Blocked status shows `blockReason` in a tooltip (`blockReasonLabels`); the destination tooltip adds "Ends at" when `finalUrl` differs; an In review badge (`reviewOpen`) links to `/admin/review?entry=<id>`; the globe button opens `BlockDomainDialog`
  - `/admin/review` — Review queue of flagged links (`adminApi.getReviewQueue`), filterable by reason and age. Row actions: Looks fine (`OK`), Trust domain, Block link, Block domain, Block user (all but Looks fine confirm first). `?entry=<urlId>` highlights and scrolls to that row, or says it's no longer open. Multi-select like All URLs (row checkboxes, a select-all for the page, cleared on a page, size or filter change): the bar shows "N selected", the same five actions and Clear, and sends one `adminApi.resolveReviews` call. All but Looks fine confirm with the number of links; Trust domain and Block domain also list the distinct domains from each entry's `host` / `registrableDomain` (the backend's defaults; entries without a domain, IPs included, are counted as staying open); Block user is disabled while an anonymous link is selected. The toast gives the resolved and failed counts (with the distinct backend errors), then the same query keys as a single resolve are invalidated
  - `/admin/blocklists` — Blocklist sources (enable switch, Refresh now, add/edit/delete), domain rules in Blocked / Trusted tabs (adding a Block rule toasts `Blocked N links on <domain>`), and a URL tester that shows the backend's verdict (`adminApi.checkUrl`)
  - `/admin/api-keys` — All API keys
  - `/admin/health` — System health (DB, Redis, SMTP, SafeBrowsing)
  - `/admin/audit-log` — Admin action audit trail. `action` is an `AuditAction` (string-literal union in `types.ts`) shown through an explicit label map ("Resolved review", "Blocked domain", "Revoked link", …; an unlisted value is title-cased) and a colour map; `failed` adds "(failed)" in red. The Action select filters on the server (`?action=`)
  - `/admin/email-log` — Email delivery log; failed emails the backend still has content for (`resendable`) get a Resend button

`@/*` path alias maps to **project root** (e.g. `@/lib/api-client` → `lib/api-client.ts`).

### Key directories
```
app/          — Next.js App Router pages
components/   — React components
  ui/         — shadcn/ui primitives (button, card, dialog, table, etc.)
  dashboard/  — Dashboard-specific (create-url-dialog, dashboard-nav)
  analytics/  — Analytics page: link-analytics (one link), overview-analytics, range-picker, stat-totals, clicks-chart, breakdown-list
  admin/      — Moderation: block-domain-dialog (shared by the review queue and All URLs), blocklists/ (the Blocklists page sections)
lib/          — Shared logic
  api-client.ts   — Fetch-based API client
  auth-context.tsx — Auth state (React context)
  types.ts        — All TypeScript interfaces
  labels.ts       — Display labels for URL-check outcomes (`outcomeLabels`, `outcomeVariants`) and block reasons (`blockReasonLabels`)
  analytics.ts    — Analytics ranges (`ANALYTICS_RANGES`, `rangeLabels`, `parseAnalyticsRange`), `parseLinkId`, `analyticsHref({ link, days })`, `ANALYTICS_HISTORY_START`, `analyticsDay()` (a `yyyy-MM-dd` day at local midnight), breakdown labels (`breakdownLabel`) and `countryFlag`
  hooks/          — TanStack React Query hooks (useUrls, useApiKeys, useUsers, useReviewCount, useAnalytics)
  utils.ts        — cn(), formatDate(), formatTimeAgo() ("3 hours ago", "—" for null), getApiBaseUrl(), etc.
```

### API Client (`lib/api-client.ts`)
- `request<T>(method, path, body?, headers?)` — fetch wrapper with auth token injection
- Reads `localStorage.getItem("auth-token")` and sends it as-is in the `Authorization` header. The stored value already starts with `Bearer ` (the login response's `token`; the OAuth callback adds the prefix)
- `ApiError` class exposes `.status` and `.message`; `REQUEST_FAILED` is the fallback message when the body has none
- `request()` reads JSON or plain-text bodies (`POST /auth/register` answers with the bare email); error messages come from `error`, `message`, or the joined field messages of a validation response
- Signing in or out clears the React Query cache; a failed `/users/me` only drops the token on 401/403
- API base URL switches by env:
  - **Dev**: `/api/v1`
  - **Prod**: `https://hrva.cc/api/v1`
- **`urlApi`** — URL CRUD (create, list, peek, preview, QR, update, deactivate, delete, bulk, export)
- **`userApi`** — User CRUD (me, list, update, password, delete); `list` takes `possibleScammer`
- **`adminApi`** — Admin operations (stats, export, audit log with an optional `action` filter, email log, login attempts) and moderation:
  - blocklist sources: `getBlocklistSources`, `createBlocklistSource`, `updateBlocklistSource`, `deleteBlocklistSource`, `refreshBlocklistSource` (`/admin/blocklist-sources`, `POST …/{id}/refresh`)
  - domain rules: `getDomainRules(type)`, `createDomainRule` (returns `{ rule, linksAffected }`), `deleteDomainRule` (`/admin/domain-rules`)
  - review queue: `getReviewQueue({ page, size, reason, olderThanDays })`, `resolveReview(urlId, action, domain?)` (`/admin/review-queue`, `POST …/{urlId}/resolve`), `resolveReviews(urlIds, action)` (`POST /admin/review-queue/resolve` with 1–100 distinct ids, returns `{ resolved: number[], failed: { urlId, error }[] }`)
  - users: `blockUser`, `unblockUser` (return `{ linksAffected }`), `getPossibleScammers` (user ids)
  - `checkUrl(url)` — `POST /admin/url-check`, the verdict (`ALLOWED` / `BLOCK` / `FLAG` / `CLEAN`) a new link would get
- **`analyticsApi`** — `getUrlAnalytics(id, days)` → `GET /analytics/urls/{id}?days=` (summary, totals, zero-filled `daily`, top-10 breakdowns plus `other`); `getOverview(days)` → `GET /analytics/overview?days=` (totals, zero-filled `daily`, top 10 links by clicks, all-time counters)
- **`reportApi`** — `report({ shortUrl, category, details? })` → `POST /reports` (public, rate-limited per network)
- Endpoints returning paginated data accept `UrlFilters` / `UserFilters` for search/status/date filtering

### Auth (`lib/auth-context.tsx`)
- React Context provider wrapping the tree under `Providers`
- On mount: reads `auth-token` from localStorage, calls `GET /users/me` to hydrate user
- `login()` stores token and sets user; `logout()` removes token and clears user
- `isAdmin` derived from `user.authorities` containing `{ name: "ROLE_ADMIN" }`
- **No route protection middleware** — dashboard/admin layouts redirect client-side via `useEffect`

### Data Fetching (TanStack React Query 5)
- Query client in `providers.tsx`: `staleTime: 30s`, `retry: 1`
- Hooks in `lib/hooks/` follow pattern: `useXxx()` for queries, `useXxx()` for mutations
- Mutations invalidate relevant query keys (`["urls"]`, `["apiKeys"]`, `["users"]`, `["me"]`); moderation keys live under `["admin", …]` (`["admin", "review"]`, `["admin", "domain-rules", type]`, `["admin", "blocklists"]`)
- `useUrlAnalytics(id, days)` — key `["analytics", "url", id, days]`; keeps the previous range on screen (dimmed) while a new range loads, and doesn't retry a 4xx
- `useAnalyticsOverview(days)` — key `["analytics", "overview", days]`; the same previous-range and no-4xx-retry behaviour
- `useReviewCount()` — admin-only `GET /admin/review-queue?size=1` → `totalElements`, refetched every 60 s. Its key `["admin", "review", "count"]` sits under `["admin", "review"]`, so anything that resolves or blocks invalidates the count too
- Pagination via `hooks/usePagination.ts` — reads `page`, `size`, `sort`, `order` from URL search params
- Sortable columns: click table headers to toggle asc/desc, resets to page 0

### Styling
- Tailwind CSS 4 with shadcn-style HSL CSS variables in `app/globals.css`, which also holds the theme (`@theme`; there is no `tailwind.config.js`); visual rules live in `DESIGN.md`
- `space-y-*` puts its margin on the bottom of each child, which an inline first child (a `<label>`, a `<Link>`) ignores; a label above an input uses `mt-*` on the input instead
- Light by default (follows the system); `.dark` class via `next-themes` (`attribute="class"`)
- `primary` is near-black (white in dark mode) and is for primary buttons; `brand` (electric blue) is the single accent for links, short URLs, focus and charts; `success` / `warning` / `destructive` for status
- Fonts: Host Grotesk (`font-sans`, and `font-display` = same family at weight 650) + JetBrains Mono (`font-mono`, short codes and code) via `next/font`
- Motion: one entrance, `.animate-result-in`, for a freshly shortened link; `.animate-copy-pulse` for copy feedback
- Public pages share `components/site-header.tsx` and `components/site-footer.tsx`

### UI Components
- shadcn/ui style: compose Radix primitives + `class-variance-authority` + `tailwind-merge` (via `cn()`)
- Nesting a dialog trigger inside a tooltip: `Tooltip > TooltipTrigger asChild > AlertDialogTrigger asChild > button`. The reverse (`AlertDialogTrigger asChild > Tooltip`) renders no element for the trigger, so the click never opens the dialog
- Admin nav (`components/dashboard/dashboard-nav.tsx`): the Admin dropdown and the Review queue item show the open review count (`useReviewCount`, `99+` above 99, hidden at 0). The badge is `relative` so its `sr-only` text can't widen the page at phone width
- `sonner` for toasts, `lucide-react` for icons, `qrcode.react` for QR codes
- `recharts` for analytics charts (used in `components/analytics/clicks-chart.tsx`)

### Deployment (Cloudflare Workers)
- Built with `@opennextjs/cloudflare` — config at `open-next.config.ts` (minimal, uses defaults)
- `wrangler.jsonc`: name `url-shortener`, `nodejs_compat` flag, assets from `.open-next/assets`

---

## API Migration (localhost vs prod)

The local backend (`localhost:8080`) has an updated API that differs significantly from what the current frontend (`hrva.cc` prod) uses. The frontend **needs to be updated** to match the new API layout below:

### URL Endpoints

| Old | New | Notes |
|-----|-----|-------|
| `POST /api/v1/url/new` | `POST /api/v1/urls` | Same body |
| `POST /api/v1/url/new/{apiKey}` | `POST /api/v1/urls` (with `X-Api-Key` header) | API key moved from path to header |
| `GET /api/v1/url/redirect/{short}` | `GET /api/v1/urls/{short}` | |
| `GET /api/v1/url/peek/{short}` | `GET /api/v1/urls/{short}/peek` | Moved to /peek (old /preview now returns link preview) |
| `PUT /api/v1/url` | `PUT /api/v1/urls/{id}` | `id` moved from body to path |
| `GET /api/v1/url/my` | `GET /api/v1/urls` | Now paginated (`?page=0&size=20`) |
| `GET /api/v1/url/my/{apiKey}` | `GET /api/v1/urls` (with `X-Api-Key` header) | API key in header |
| `GET /api/v1/url/all` | `GET /api/v1/urls/all` | Now paginated |
| `GET /api/v1/url/deactivate/{id}` | `PATCH /api/v1/urls/{id}/deactivate` | **GET → PATCH** |
| `GET /api/v1/url/delete/{id}` | `DELETE /api/v1/urls/{id}` | **GET → DELETE** |

### API Key Endpoints

| Old | New | Notes |
|-----|-----|-------|
| `GET /api/v1/key/new` | `POST /api/v1/api-keys` | **GET → POST** |
| `GET /api/v1/key/my` | `GET /api/v1/api-keys` | |
| `GET /api/v1/key` | `GET /api/v1/api-keys/all` | Now paginated |
| `PUT /api/v1/key` | `PUT /api/v1/api-keys/{id}` | `id` moved from body to path |
| `GET /api/v1/key/revoke/{id}` | `PATCH /api/v1/api-keys/{id}/revoke` | **GET → PATCH** |

### User Endpoints

| Old | New | Notes |
|-----|-----|-------|
| `GET /api/v1/user/all` | `GET /api/v1/users` | Now paginated |
| `PUT /api/v1/user` | `PUT /api/v1/users/{id}` | `id` moved from body to path |
| `PUT /api/v1/user/update-password` | `PATCH /api/v1/users/password` | |
| `DELETE /api/v1/user/{id}` | `DELETE /api/v1/users/{id}` | Unchanged |
| `GET /api/v1/user/me` | `GET /api/v1/users/me` | |

### Auth Endpoints

| Old | New | Notes |
|-----|-----|-------|
| `POST /api/v1/auth/register` | Unchanged | `name` removed from body |
| `POST /api/v1/auth/login` | Unchanged | |
| `POST /api/v1/auth/reset-password` | `POST /api/v1/auth/password-reset` | |
| `POST /api/v1/auth/reset-password/set-password` | `POST /api/v1/auth/password-reset/confirm` | |

### Response Shape Changes

- **List endpoints now paginated**: `GET /urls`, `/urls/all`, `/api-keys/all`, `/users` return `Page<T>` with `content`, `totalElements`, `totalPages`, `number`, `size`. Add `?page=0&size=20` query params.
- **`UrlResponse`** replaces raw `Url` entity — fields removed: `owner`, `apiKey`, `lastAccessed`, `lastSafeBrowsingCheck`, `platformType`, `threatEntryType`, `threatType`. New field: `ownerEmail` (populated for owned URLs, null for anonymous).
- **`ApiKeyResponse`** replaces raw `ApiKey` entity — fields removed: `owner`, `urls`
- **Error format**: now `{ "error": "message" }` instead of old `ApiException` wrapper
- **CORS**: now allows all standard methods (`GET, POST, PUT, PATCH, DELETE, OPTIONS`) instead of only `GET, POST`

### New Endpoints (backend only, not yet in prod)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/v1/urls/{short}/qr?size=300` | GET | Returns QR code as `image/png` bytes. Default 300×300. Use directly in `<img>` src via `urlApi.getQrCodeUrl(short)`. |
| `GET /api/v1/urls/{short}/preview` | GET | Link preview: scrapes destination URL for OG/Twitter meta tags. Returns `LinkPreviewResponse { url, title?, description?, imageUrl? }`. Gracefully degrades (null fields) on timeout/error. |
| `POST /api/v1/urls/bulk` | POST | Bulk create URLs. Body: `[ CreateUrlDto, ... ]`. Response: `[ UrlResponse, ... ]`. Requires auth (`ROLE_USER`). |
| `GET /api/v1/admin/audit-log` | GET | Paginated admin audit trail; `?action=` filters by one `AuditAction`. Each entry has `action` (an `AuditAction` name) and `failed` (boolean, shown as a destructive "(failed)" badge). |
| `GET /api/v1/admin/email-log` | GET | Paginated email delivery log. Statuses: SENT=success, FAILED=destructive, SENDING=secondary, RESENT=outline. |
| `POST /api/v1/admin/email-log/{id}/resend` | POST | Sends a failed email again; returns the new log entry (SENT or FAILED). |
| `GET /api/v1/admin/login-attempts` | GET | Map of IP → attempt count for active rate limits. |
| `DELETE /api/v1/admin/login-attempts` | DELETE | Clear all login rate limits. |
| `GET /api/changelog` | GET | Changelog JSON (all releases, sections, items). Public. |

---

## Gotchas

- **No `.env` files** — API base URL is hardcoded in `lib/utils.ts` and switches on `NODE_ENV`
- **Pointing dev at another backend port**: change the four `localhost:8080` rewrites in `next.config.mjs` and `getShortBaseUrl()` in `lib/utils.ts`, and don't commit it. Run the dev server on 3000, where the backend's `app.frontend-url` sends `/unavailable` redirects
- **Auth token is stored with its `Bearer ` prefix** — `request()` adds nothing, so a token injected into `auth-token` by hand must include it
- **No middleware-based route protection** — dashboard/admin check auth in a client `useEffect`, creating a flash of unauthenticated content
- **`@/*` maps to root** — unlike the common Next.js pattern of mapping to `src/*`
- **pnpm/npm**: lockfile is `package-lock.json` (npm), not pnpm
- **Changelog page** at `/changelog` is a client component — fetches changelog JSON from backend `/api/changelog`
- **Easter eggs**: Konami code (↑↑↓↓←→←→BA) on landing page, `/fortune`, `/egg`, console message hint
- **Animations**: `animate-copy-pulse` class, `CountUp` component for stat counters, staggered row entrance via `animate-fade-in` with inline delay, filter remount via `filterKey` 
