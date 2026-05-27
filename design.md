# Ibadah Design System

> One design language across `client/` (user-facing app), `admin/` (admin panel)
> and `server/` (API contracts). When in doubt, mirror the client.

This document captures the **shared** decisions: tokens, typography,
components, motion, API conventions, and layout shells. New surfaces should
adopt these patterns instead of reinventing them.

---

## 1. Brand foundation

| | |
|---|---|
| **Name** | Ibadah |
| **Tagline** | Journey Towards Allah |
| **Voice** | Calm, reverent, modern. Encouragement over gamification. |
| **Logomark** | 8-pointed Khatim Sulaymani star + crescent + accent star, in a rounded gradient frame. See `client/src/components/shared/brand-logo.tsx`. |
| **Direction** | LTR by default; full RTL support for `ar`. Layouts must be `dir`-aware. |

The mark is the **only** image asset that is universal across surfaces.
Both `client/` and `admin/` import the same `BrandLogo` (or a copy of it
with identical SVG geometry).

---

## 2. Color tokens (OKLCH custom properties)

All color is expressed as CSS custom properties in `globals.css`, then
exposed to Tailwind via `@theme inline`. **Do not** hardcode hex/rgb in
components — always reference `var(--token)` or the Tailwind class
backed by it (`bg-primary`, `text-foreground`, etc.).

### 2.1 Surface

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | ivory `oklch(0.985 0.006 90)` | midnight `oklch(0.14 0.02 220)` | App canvas |
| `--foreground` | deep teal `oklch(0.18 0.025 165)` | near-white `oklch(0.96 0.005 95)` | Body text |
| `--card` | white | `oklch(0.19 0.022 220)` | Card surfaces |
| `--muted` / `--muted-foreground` | warm grey | desaturated dark | Secondary text, dividers |
| `--border` / `--input` | low-contrast warm grey | low-contrast dark | Outlines |

### 2.2 Brand

| Token | Light | Dark | Role |
|---|---|---|---|
| `--primary` | deep emerald `oklch(0.46 0.13 165)` | luminous emerald `oklch(0.74 0.13 165)` | Primary CTA, active nav |
| `--primary-soft` | mid emerald | mid emerald | Gradients, focus states |
| `--primary-deep` | dark emerald | mid-dark emerald | Hero gradients |
| `--accent` | warm gold `oklch(0.82 0.13 80)` | warm gold | Highlights, badges |
| `--accent-deep` | burnished gold | burnished gold | Secondary gradient stops |
| `--tertiary` | twilight violet `oklch(0.6 0.16 295)` | twilight violet | Tertiary accent, charts |

### 2.3 Status

| Token | Use |
|---|---|
| `--success` | Confirmation, completed states |
| `--destructive` | Errors, delete actions |
| `--ring` | Focus rings (defaults to `--primary`) |

### 2.4 Charts & prayer moods

`--chart-1..5` for Recharts series. Prayer cards use a gradient stop
pair per waqt (`--prayer-fajr-from` / `-to`, etc.) to evoke the time of
day. Reuse these in admin analytics views — do not invent new hues.

---

## 3. Typography

| Family | Token | Use |
|---|---|---|
| Inter | `--font-sans` | All UI text |
| Amiri | `--font-display` | Arabic verses, ornamental headings (`.font-display`) |

- **Hierarchy:** `text-3xl/4xl` page titles, `text-xl/2xl` section, `text-sm` body, `text-xs/uppercase tracking-[0.2em]` for eyebrow labels.
- **Numerals:** use `tabular-nums` for any counter, score, or stat.
- **Arabic:** wrap in `<p dir="rtl" lang="ar" className="font-display">`.

Gradient text utilities:
- `.text-gradient` — primary → accent-deep → tertiary
- `.text-gradient-soft` — primary → accent

---

## 4. Layout shells

There are **three** primary shells. Each app picks one per route group.

### 4.1 Marketing shell (`client/`)
Full-bleed hero with `bg-aurora` + `MarketingNav` + `Footer`.

### 4.2 Auth shell (`client/`, `admin/`)
Two-column on `lg`: gradient inspirational pane (left) + form card (right).
The form card is `rounded-2xl border bg-card p-8 shadow-2xl shadow-primary/5`.
Mobile collapses to a single column with `bg-aurora-soft` backdrop.

### 4.3 Dashboard shell (`client/`) / Panel shell (`admin/`)
- **Desktop:** sticky 64-unit sidebar + 16-unit topbar; content `max-w-5xl` (client) or `max-w-7xl` (admin) under the topbar with `bg-aurora-soft` ambient backdrop.
- **Mobile (`client/` only):** bottom nav with primary 4 + a "More" sheet for the rest. Admin is desktop-first, so the sidebar collapses to an overlay sheet on mobile but there is **no bottom nav**.
- Sidebar items group as `Tracking` (or `Operations` in admin) and `Account` (or `System`).
- Active item: gradient highlight `from-primary/15 via-primary/8 to-transparent` + a 0.5w gradient bar on the leading edge.

---

## 5. Component conventions (shadcn/ui — New York style)

All UI primitives live in `src/components/ui/` and follow shadcn defaults.

| Component | Notes |
|---|---|
| **Button** | `variant`: `default | secondary | outline | ghost | destructive | link`. `size`: `default | sm | lg | icon`. Always `rounded-md`. |
| **Card** | `rounded-xl border bg-card shadow-sm`. Header padding `p-6`, content `p-6 pt-0`. |
| **Input / Select / Textarea** | `h-10 rounded-md border-input bg-background`. Focus: `ring-2 ring-ring ring-offset-1`. |
| **Badge** | Pill (`rounded-full`). Variants tone-coded to status colors. |
| **Tabs** | Pill list (`rounded-full border bg-card/60 backdrop-blur`). Active: `bg-foreground text-background`. |
| **Avatar** | Image with circular fallback gradient (primary → accent-deep) + initials. Always `rounded-full` for users, `rounded-2xl` for brand mark. |
| **Sheet** | Use for any mobile drawer or slide-over. |

### 5.1 Surfaces and effects

| Utility | Use |
|---|---|
| `.glass-card` | Frosted card on top of imagery |
| `.surface-elevated` | Solid card with subtle inset highlight + shadow |
| `.glow-emerald` / `.glow-gold` | Hover glow on prominent CTAs |
| `.bg-aurora` / `.bg-aurora-soft` | Ambient backdrops |
| `.bg-pattern` / `.bg-pattern-stars` / `.bg-grid` | Decorative repeating patterns |
| `.shimmer-accent` | Loading shimmer line |
| `.animate-breathe`, `.animate-fade-up`, `.animate-fade-in`, `.animate-glow-pulse` | Standard motion |

### 5.2 Spacing & rhythm

- Page top padding: `pt-5` mobile / `pt-8` desktop (in dashboard layout).
- Section spacing: `space-y-6` between sibling blocks; `space-y-4` inside cards.
- Container: `max-w-5xl mx-auto` for client dashboard, `max-w-7xl mx-auto` for admin (data-dense).

---

## 6. Motion

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances.
- Default duration: `0.85s` for reveals, `0.4s` for hover transitions.
- Respect `prefers-reduced-motion`: all `.reveal-*`, `.marquee-*`, and global `scroll-behavior` disable themselves under reduced motion.
- Stagger delays: `delay-75 / 150 / 300 / 500 / 700`.

---

## 7. Iconography

- Lucide Icons only. `size-4` inline, `size-5` for prominent, `size-6+` for hero.
- One icon per nav item. Pick semantic icons (`LayoutDashboard`, `BookOpen`, `HandHeart`, `ListChecks`).
- Admin-only icons (no client equivalent): `ShieldCheck` for moderation, `Activity` for system, `Users` for user management, `FileText` for logs.

---

## 8. API contracts

Every server response uses the envelope:

```json
{ "success": true, "message": "...", "data": { ... }, "meta": { ... } }
```

The client `api()` helper unwraps `data` and throws `ApiClientError` on
non-2xx or `success: false`. The admin uses **the exact same helper**
(copied verbatim into `admin/src/lib/api.ts`) so both apps fail in the
same shape.

### 8.1 Auth flow (shared)

1. `POST /auth/login` with `{ email, password }` → `{ user, accessToken, refreshToken }`.
2. Tokens persisted in `localStorage` (`ibadah:access`, `ibadah:refresh`).
3. Authenticated requests send `Authorization: Bearer <accessToken>`.
4. `GET /auth/me` rehydrates the user on app load; on 401 the client clears storage and redirects to `/login`.
5. Admin uses the **same login endpoint** — there is currently no separate admin login. Authorization happens server-side once an `isAdmin` field is added to the User model (see §10).

### 8.2 Date keys

All daily resources use `YYYY-MM-DD` strings normalized to UTC midnight
on the server. Use `toDayKey(date)` from `lib/utils.ts` on both clients.

### 8.3 Error display

- Form errors: inline `<p className="text-xs text-destructive">` under the field.
- Action errors: `toast.error(...)` via Sonner (`richColors position="top-right"`).
- Empty states: card with eyebrow label + descriptive text + primary CTA.

---

## 9. Internationalization

- `client/` uses `next-intl` with `en`, `bn`, `ar` locales. Default `en`. RTL flips on `ar`.
- `admin/` is **English-only** by design — admin operators are a small internal audience and i18n adds friction without value at this scale. If admin grows beyond a single language, mirror the client's `next-intl` setup.
- Brand microcopy that appears in both apps (e.g. "Journey Towards Allah") lives in `client/messages/*.json`. Admin hardcodes the English string directly.

---

## 10. Admin panel: scope and gaps

The admin app under `admin/` consumes the **existing per-user API**.
Every server route today is gated by `requireAuth` and reads
`req.user.id` from the JWT, which means an authenticated admin user can
only see and edit their own data.

- **Analytics** (read-only):
  - **`/dashboard`** — system metrics (DAU / WAU / MAU, totals,
    content counts), top-5 leaderboard preview, recent active users,
    content footprint, and a 30-day engagement strip linking to the
    full analytics page.
  - **`/analytics`** — the full analytics suite. Range picker (7/30/
    90/365 days or custom). KPI strip (active users, signups, total
    points, engagement %). Five-card pillar breakdown across salah,
    quran, habits, checklist and dhikr (each with the metrics that
    matter for that pillar — on-time rate for salah, completion rate
    for habits/checklist, top-N presets for dhikr, etc.). Tabbed
    time-series charts: engagement (DAU + signups), points by pillar,
    content volume (quran pages, dhikr count). Salah timing donut +
    score distribution histogram. Top dhikr presets bar chart.
  - **`/leaderboard`** — top users by points across a configurable
    date range, with pillar mini-bars.
  - **`/active-users`** — users seen in the last 24h / 7d / 30d / 90d.
- **Manage**:
  - **`/users`** — list/search/filter/sort with promote/demote/
    suspend/unsuspend/delete in a row dropdown. Self-protection
    rails prevent demoting, suspending, or deleting the *last active
    admin* or *yourself*.
  - **`/users/:id`** — full per-user detail with its own range picker.
    Five-card pillar breakdown for that user, GitHub-style activity
    heatmap, daily-points-by-pillar chart, content-volume chart,
    salah timing donut, and account actions (promote/suspend/delete).
  - **`/defaults`** — admin-managed starter templates for habits,
    checklist, and dhikr. Copied to a new user on signup; **never**
    retroactively applied to existing users. Users immediately own
    and can edit/delete their copies.
- **System**: extended health (DB ping latency, memory, Node version,
  endpoint catalog), polled every 15s.
- **Settings**: edit your own admin profile (name, avatar, locale,
  timezone). For other users, use the Users page.

### 10.3 What the admin panel **does not** do

- Edit any user's salah / quran / dhikr / habit / checklist data.
- Force users to follow the admin's defaults beyond signup. Defaults
  are seeds, not constraints.
- Display non-public PII beyond `name`, `email`, `avatar`, `role`,
  `suspended`, and `lastActiveAt`.

### 10.4 Admin endpoints (live)

All under `/api/v1/admin/*`, guarded by `requireAuth + requireAdmin`:

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/admin/metrics` | DAU/WAU/MAU + total/admin/suspended counts + content footprint counts |
| `GET`    | `/admin/leaderboard?from&to&limit` | Top users by total points in a date range |
| `GET`    | `/admin/active-users?days&limit` | Users seen in the last N days |
| `GET`    | `/admin/health` | DB state + ping latency + memory + node version |
| `GET`    | `/admin/analytics/overview?from&to` | **Full analytics for the chosen window**: signups timeline, DAU timeline, full pillar breakdown (salah status counts, sunnah/nafl/witr/jummah counts; habits/checklist/quran/dhikr aggregates), zero-filled daily timeline across all pillars, and a 6-bucket score distribution histogram |
| `GET`    | `/admin/users/:id/analytics?from&to` | **Per-user analytics**: pillar breakdown for one user + zero-filled daily timeline (drives the heatmap) |
| `GET`    | `/admin/users?search&role&status&page&limit&sort` | Paginated user list |
| `GET`    | `/admin/users/:id` | User detail (lightweight summary) |
| `PATCH`  | `/admin/users/:id` | Update role / suspended / name |
| `DELETE` | `/admin/users/:id` | Hard delete + cascade across daily collections |
| `GET`    | `/admin/defaults` | Read starter habit/checklist/dhikr templates |
| `PUT`    | `/admin/defaults` | Replace starter templates (set-and-replace, no merge) |

The two analytics endpoints return everything the corresponding page
needs in a **single round-trip**. The aggregations live in
`server/src/modules/admin/analytics.service.ts` and use Mongo `$facet`
+ parallel queries to keep latency reasonable. All daily series are
**zero-filled** so the frontend never has to handle gaps.

### 10.5 Bootstrapping the first admin

There is no UI to grant admin from outside. The first admin is created
out-of-band by the seed script:

```bash
# in server/
ADMIN_EMAIL=admin@ibadah.local \
ADMIN_PASSWORD=change-me \
ADMIN_NAME='Ibadah Admin' \
pnpm seed:admin
```

The script is idempotent: it creates the account if it doesn't exist,
or promotes the existing account with that email to `role: 'admin'`
(and unsuspends it). Set `ADMIN_FORCE_PASSWORD_RESET=true` to also
rotate the password.
### 10.1 What works today

| Surface | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Dashboard (admin's own activity overview) | `GET /stats/daily`, `GET /stats/streaks` |
| Salah | `GET/PUT /salah/:date`, `GET /salah` |
| Quran | `GET/PUT /quran/:date`, `GET /quran` |
| Dhikr | `GET /dhikr/presets`, `GET/PUT /dhikr/:date` |
| Habits | `GET/POST/PATCH/DELETE /habits`, `GET/PUT /habits/days/:date` |
| Checklist | `GET/PUT /checklist/:date` |
| Scoring config | `GET/PATCH /users/me`, `POST /users/me/scoring/reset` |
| System health | `GET /health`, `GET /api/v1` |

### 10.2 What requires new server endpoints

The following admin pages are scaffolded with **empty states** that
explicitly name the endpoints the server needs to expose. They will
"light up" once those endpoints exist; no UI rework needed.

| Page | Required endpoints (proposal) |
|---|---|
| **Users → list / detail** | `GET /admin/users?search&page&limit`, `GET /admin/users/:id`, `PATCH /admin/users/:id`, `DELETE /admin/users/:id` |
| **Users → activity** | `GET /admin/users/:id/stats/daily?from&to`, `GET /admin/users/:id/streaks` |
| **Content moderation** | `GET /admin/checklist/items?flag=`, `GET /admin/habits?flag=` |
| **Audit log** | `GET /admin/audit?from&to&user&action` |
| **System metrics** | `GET /admin/metrics` (DB counts, daily-active users, error rate) |
| **Global config (announcements, scoring defaults)** | `GET/PUT /admin/config` |

### 10.3 Authorization model (proposal)

Add an `isAdmin: boolean` (or `role: 'user' | 'admin'`) field on the
User model. Every `/admin/*` route should be guarded by a
`requireAdmin` middleware that runs **after** `requireAuth` and 403s
non-admins. The admin frontend already inspects `user.isAdmin` on the
`/auth/me` payload to decide whether to allow the panel to render — it
is just always `false` today, so the panel falls back to "single-tenant
admin" mode (the operator manages their own data).

---

## 11. File organization (shared rules)

```
src/
├── app/                # Next.js App Router. Route groups in parens (no URL impact).
├── components/
│   ├── ui/             # shadcn primitives, no business logic
│   ├── shared/         # cross-feature components (BrandMark, ProgressRing, etc.)
│   ├── auth/           # AuthShell, AuthGuard
│   ├── layout/         # ThemeToggle, LocaleSwitcher
│   ├── dashboard/      # client app shell pieces
│   └── admin/          # admin app shell pieces (admin/ only)
├── hooks/              # React Query hooks per feature, e.g. use-salah.ts
├── lib/                # api client, *-api.ts feature wrappers, utils
├── store/              # zustand stores (sparse — only auth today)
└── i18n/               # client/ only
```

Each feature follows the **co-located triad**: `lib/<feature>-api.ts`
(transport), `hooks/use-<feature>.ts` (React Query), and a UI
component(s) under `components/<feature>/`. The admin mirrors this with
a slimmer surface — typically just a transport file and a single page.

---

## 12. Accessibility

- Color contrast: token pairs always meet AA against their background.
- Focus: every interactive element has a visible `focus-visible:ring-2 ring-ring ring-offset-1` style.
- Keyboard: all custom controls (sheets, dropdowns, tabs) use Radix primitives that handle keyboard semantics by default.
- ARIA: nav items use `aria-current="page"` when active; decorative SVGs are `aria-hidden`.
- Forms: every `<Input>` has a paired `<Label htmlFor>`.

---

## 13. Quick checklist for new pages

- [ ] Uses tokens, not hardcoded colors.
- [ ] Wrapped in the correct shell (auth / dashboard / panel).
- [ ] Eyebrow + title + optional description via `<PageHeader>`.
- [ ] Loading state (skeleton or `BrandMark` breathing) + empty state + error toast.
- [ ] Tabular numbers on counters.
- [ ] `dir`-safe layout (no `left/right`-only positioning where `start/end` works).
- [ ] Reduced-motion safe.
- [ ] If it's an admin page that depends on a future endpoint, lists the endpoint contract in this file (§10.2).
