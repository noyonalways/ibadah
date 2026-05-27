# Ibadah — Admin Panel

Internal-facing administration panel for the Ibadah application. Mirrors
the visual identity of `client/` and consumes the same REST API in
`server/` — but **only the admin-scoped endpoints**. The admin never
edits another user's worship data.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (New York style)
- TanStack Query + Zustand
- next-themes (light/dark)
- Sonner toasts
- Radix primitives for every interactive control (no native `<select>` or `<input type="date">`)

## Quick start

```bash
cp .env.example .env
# Set NEXT_PUBLIC_API_URL to your running server (e.g. http://localhost:5000/api/v1)

pnpm install
pnpm dev   # http://localhost:3001
```

You also need an admin account. See **Bootstrapping the first admin**
below.

## What the panel can do

Per [`design.md` §10.2](../design.md):

- **Dashboard** — system metrics (total / new / active users, engagement
  ratio, content footprint), leaderboard preview, recent active users,
  live operational status pill.
- **Leaderboard** — top users by total points across a configurable date
  range (presets + custom range with the custom DatePicker), pillar mini-
  bars, ranks 1–3 highlighted.
- **Active users** — windowed list (24h / 7d / 30d / 90d), most recent
  first.
- **Users** — paginated list with debounced search, role filter, status
  filter, sort options. Every row has a Radix DropdownMenu with promote/
  demote, suspend/unsuspend, delete actions. Self-protection guards
  prevent demoting, suspending, or deleting the *last active admin* or
  *yourself*.
- **Users → detail (`/users/:id`)** — full identity card, 30-day activity
  sparkline, per-pillar activity tiles, account actions in the side rail.
- **Defaults** — admin-managed starter templates (habits, checklist,
  dhikr) with a 3-tab editor and dirty-tracking save/discard. Copied to
  every new user at signup; **never retroactively applied** to existing
  users.
- **System** — extended health (DB state + ping latency, memory, Node
  version, uptime, full endpoint catalog), refresh button + auto-refresh
  every 15s.
- **Settings** — your own admin profile only (name, avatar, locale,
  timezone). Other users are managed from the Users page.

## What the panel does not do

- Does **not** edit any user's salah / quran / dhikr / habit / checklist
  data.
- Does **not** force users to follow defaults — they are seeds, not
  constraints. Once seeded, the user owns their copy and the admin
  cannot reach into it.
- Has no native HTML `<select>` or date input. Every control is custom:
  Radix Select, Radix Popover + custom Calendar, Radix DropdownMenu.

## Strict admin-only access

Every page under `(panel)/` is wrapped in `<AuthGuard>`, which:

1. Redirects unauthenticated users to `/login`.
2. Renders the panel only when `user.role === 'admin'` and `!user.suspended`.
3. Shows an explicit **Access denied** screen (with sign-out button +
   role disclosure) for any non-admin who reaches the panel — including
   suspended admins.

Server-side, every `/api/v1/admin/*` route is guarded by `requireAuth +
requireAdmin`. Admin enforcement is server-side; the guard is for UX.

## Bootstrapping the first admin

There is no UI to grant the admin role. The first admin is created
out-of-band:

```bash
cd server
ADMIN_EMAIL=admin@ibadah.local \
ADMIN_PASSWORD=change-me \
ADMIN_NAME='Ibadah Admin' \
pnpm seed:admin
```

The script is idempotent. If the email already exists, it promotes the
account to `role: 'admin'` and unsuspends it. Set
`ADMIN_FORCE_PASSWORD_RESET=true` to also rotate the password. The
script never logs the password.

Once you've seeded the first admin, additional admins can be promoted
in-app via the Users page (PATCH `/admin/users/:id { role: 'admin' }`).

## File layout

```
src/
├── app/
│   ├── (auth)/login/        # standalone auth shell
│   ├── (panel)/             # main admin shell (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── leaderboard/
│   │   ├── active-users/
│   │   ├── users/
│   │   │   └── [id]/
│   │   ├── defaults/
│   │   ├── system/
│   │   └── settings/
│   ├── icon.svg / icon.tsx / apple-icon.tsx   # shared favicon (matches client)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # redirects to /dashboard
├── components/
│   ├── admin/               # sidebar, topbar, page-header, stat-card
│   ├── auth/                # auth-shell, auth-guard, access-denied
│   ├── layout/              # theme-toggle
│   ├── shared/              # brand-mark
│   └── ui/                  # button, card, badge, avatar, label, input,
│                            # tabs, select (Radix), popover (Radix),
│                            # calendar, date-picker, dropdown-menu (Radix)
├── hooks/                   # use-auth
├── lib/                     # api (with .raw escape hatch), admin-api,
│                            # auth-api, auth-storage, utils
└── store/                   # auth-store (with isAdmin helper)
```
