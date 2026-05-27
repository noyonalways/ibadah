# Ibadah Design System

> One design language across `client/` (user-facing app), `admin/` (admin panel)
> and `server/` (API contracts). When in doubt, mirror the client.

This document captures the **shared** decisions: tokens, typography,
components, motion, API contracts, layout shells, and — most importantly
— the **role boundaries** between the user app and the admin panel.

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
with identical SVG geometry) and the same `icon.svg` / `icon.tsx` /
`apple-icon.tsx` favicon trio, so the browser tab is identical
everywhere.

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

`--chart-1..5` for Recharts series. Reuse these in admin analytics views
— do not invent new hues.

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

Three primary shells. Each app picks one per route group.

### 4.1 Marketing shell (`client/`)
Full-bleed hero with `bg-aurora` + `MarketingNav` + `Footer`.

### 4.2 Auth shell (`client/`, `admin/`)
Two-column on `lg`: gradient inspirational pane (left) + form card (right).
The form card is `rounded-2xl border bg-card p-8 shadow-2xl shadow-primary/5`.
Mobile collapses to a single column with `bg-aurora-soft` backdrop.

### 4.3 Dashboard shell (`client/`) / Panel shell (`admin/`)
- **Desktop:** sticky 64-unit sidebar + 16-unit topbar; content `max-w-5xl` (client) or `max-w-7xl` (admin) under the topbar with `bg-aurora-soft` ambient backdrop.
- **Mobile (`client/` only):** bottom nav with primary 4 + a "More" sheet for the rest. Admin is desktop-first, so the sidebar collapses to an overlay sheet on mobile but there is **no bottom nav**.
- Sidebar items group as `Tracking` (client) or `Analytics / Manage / System` (admin).
- Active item: gradient highlight `from-primary/15 via-primary/8 to-transparent` + a 0.5w gradient bar on the leading edge.

---

## 5. Component conventions (shadcn/ui — New York style)

All UI primitives live in `src/components/ui/` and follow shadcn defaults.

| Component | Notes |
|---|---|
| **Button** | `variant`: `default | secondary | outline | ghost | destructive | link`. `size`: `default | sm | lg | icon`. Always `rounded-md`. |
| **Card** | `rounded-xl border bg-card shadow-sm`. Header padding `p-6`, content `p-6 pt-0`. |
| **Input** | `h-10 rounded-md border-input bg-background`. Focus: `ring-2 ring-ring ring-offset-1`. |
| **Select** | **Radix `@radix-ui/react-select`** — never a native `<select>`. See §5.3. |
| **DatePicker** | **Radix Popover + custom Calendar** — never a native `<input type="date">`. See §5.3. |
| **DropdownMenu** | Radix dropdown for row actions (suspend / delete / etc.). |
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

### 5.3 No-native-controls rule (admin panel)

The admin panel **must not** render native HTML form controls that
operating systems style differently from one another. All such controls
are replaced with custom Radix-backed primitives in
`admin/src/components/ui/`:

| Native control | Replacement | Component |
|---|---|---|
| `<select>` | Radix Select | `select.tsx` |
| `<input type="date">` | Custom calendar in a Radix Popover | `calendar.tsx` + `date-picker.tsx` |
| Native dropdown menus / row-action `<select>` | Radix DropdownMenu | `dropdown-menu.tsx` |

Custom Calendar is dependency-free (no `date-fns` in the picker layer)
— it works with our canonical `YYYY-MM-DD` day-key strings.

The **client** app may continue to use native controls or
shadcn-equivalent primitives at its own discretion; the rule is
admin-scoped.

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
- Admin-only icons: `ShieldCheck` for admin/role, `Trophy` for leaderboard, `UserCheck` for active users, `Sparkles` for defaults/promote, `PauseCircle`/`PlayCircle` for suspend/unsuspend.

---

## 8. API contracts

Every server response uses the envelope:

```json
{ "success": true, "message": "...", "data": { ... }, "meta": { ... } }
```

The client `api()` helper unwraps `data` and throws `ApiClientError` on
non-2xx or `success: false`. The admin uses **the exact same helper**
(copied verbatim into `admin/src/lib/api.ts`) and adds an `api.raw()`
escape hatch for paginated endpoints that need `meta.total / page /
totalPages`.

### 8.1 Auth flow (shared)

1. `POST /auth/login` with `{ email, password }` → `{ user, accessToken, refreshToken }`.
2. Tokens persisted in `localStorage` (`ibadah:access`, `ibadah:refresh`).
3. Authenticated requests send `Authorization: Bearer <accessToken>`.
4. JWT now includes a `role` claim (`user | admin`); the admin panel
   inspects `user.role === 'admin'` on every guarded screen.
5. `requireAuth` middleware validates the token, blocks `suspended`
   accounts (403), and updates `lastActiveAt` on every request.
6. `requireAdmin` middleware (runs after `requireAuth`) enforces the
   admin role on every `/api/v1/admin/*` route. Non-admins get a `403`.

### 8.2 Date keys

All daily resources use `YYYY-MM-DD` strings normalized to UTC midnight
on the server. Use `toDayKey(date)` from `lib/utils.ts` on both clients.
The admin's custom `Calendar` and `DatePicker` produce these keys
directly so callers never have to think about timezones.

### 8.3 Error display

- Form errors: inline `<p className="text-xs text-destructive">` under the field.
- Action errors: `toast.error(...)` via Sonner (`richColors position="top-right"`).
- Empty states: card with eyebrow label + descriptive text + primary CTA.

---

## 9. Internationalization

- `client/` uses `next-intl` with `en`, `bn`, `ar` locales. Default `en`. RTL flips on `ar`.
- `admin/` is **English-only** by design — admin operators are a small internal audience.
- Brand microcopy that appears in both apps lives in `client/messages/*.json`. Admin hardcodes the English string directly.

---

## 10. Role boundaries

The two apps have **strictly separate jobs**. The user-facing client owns
all individual worship data; the admin manages identity, defaults, and
analytics — and never edits another user's logged worship.

### 10.1 What the user app does (`client/`)

- Lets every user create / edit / delete their **own** salah, quran,
  dhikr, habit, and checklist data, on their own timetable.
- Lets every user customize their own scoring weights and dhikr
  targets.
- Cannot list or read any other user's data.

### 10.2 What the admin panel does (`admin/`)

- **Analytics** (read-only): system metrics (DAU / WAU / MAU, totals,
  content counts), leaderboard (top users by points across a date
  range), active-users window, content footprint.
- **Manage**:
  - Users — list/search/filter (role, status), promote/demote, suspend/
    unsuspend, delete (with cascade across all the user's daily
    collections). Self-protection guard rails prevent demoting,
    suspending, or deleting the *last active admin* or *yourself*.
  - Defaults — admin-managed starter templates for habits, checklist,
    and dhikr. Copied to a new user on signup; **never** retroactively
    applied to existing users. Users immediately own and can edit/
    delete their copies.
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
| `GET`    | `/admin/metrics` | DAU/WAU/MAU, total/admin/suspended counts, content totals |
| `GET`    | `/admin/leaderboard?from&to&limit` | Top users by total points in a date range |
| `GET`    | `/admin/active-users?days&limit` | Users seen in the last N days |
| `GET`    | `/admin/health` | DB state + ping latency + memory + node version |
| `GET`    | `/admin/users?search&role&status&page&limit&sort` | Paginated user list |
| `GET`    | `/admin/users/:id` | User detail + last-30d activity sparkline |
| `PATCH`  | `/admin/users/:id` | Update role / suspended / name |
| `DELETE` | `/admin/users/:id` | Hard delete + cascade across daily collections |
| `GET`    | `/admin/defaults` | Read starter habit/checklist/dhikr templates |
| `PUT`    | `/admin/defaults` | Replace starter templates (set-and-replace, no merge) |

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

---

## 11. File organization

```
src/
├── app/                # Next.js App Router. Route groups in parens (no URL impact).
├── components/
│   ├── ui/             # shadcn primitives, no business logic
│   ├── shared/         # cross-feature components (BrandMark, ProgressRing, etc.)
│   ├── auth/           # AuthShell, AuthGuard, AccessDenied
│   ├── layout/         # ThemeToggle, LocaleSwitcher
│   ├── dashboard/      # client app shell pieces
│   └── admin/          # admin app shell pieces (admin/ only)
├── hooks/              # React Query hooks per feature
├── lib/                # api client, *-api.ts feature wrappers, utils
├── store/              # zustand stores
└── i18n/               # client/ only
```

The `admin/` app keeps a slim surface: one transport file
(`lib/admin-api.ts`) covers every `/admin/*` endpoint plus `/users/me`,
and the page count is intentionally small (8 pages).

---

## 12. Accessibility

- Color contrast: token pairs always meet AA against their background.
- Focus: every interactive element has a visible `focus-visible:ring-2 ring-ring ring-offset-1` style.
- Keyboard: all custom controls (sheets, dropdowns, tabs, select, popover, calendar) use Radix primitives or custom keyboard handlers that match Radix semantics.
- ARIA: nav items use `aria-current="page"` when active; decorative SVGs are `aria-hidden`; buttons used as date cells expose `aria-pressed`.
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
- [ ] **Admin pages only:** uses Radix Select / DatePicker / DropdownMenu — no native `<select>` or `<input type="date">`.
- [ ] **Admin pages only:** never edits a user's worship data; only their account state or system-wide defaults.
