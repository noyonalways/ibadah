# Ibadah — Admin Panel

Internal-facing administration panel for the Ibadah application. Mirrors the
visual identity of `client/` and consumes the same REST API in `server/`.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (New York style)
- TanStack Query + Zustand
- next-themes (light/dark)
- Sonner toasts

## Quick start

```bash
cp .env.example .env
# set NEXT_PUBLIC_API_URL to your running server (e.g. http://localhost:5000/api/v1)

npm install
npm run dev   # http://localhost:3001
```

## Authentication

The admin uses the **same** `/auth/login` endpoint as the user-facing client.
Until the server adds an `isAdmin` flag and `requireAdmin` middleware (see
[`design.md` §10](../design.md)) any authenticated user can sign in to the
admin panel and operate on **their own data**.

## What the panel can do today

Per `design.md` §10.1 — every page is wired to the existing per-user API:

- **Dashboard** — operator's daily/weekly stats, streaks, ambient ledger
- **Users** — *single-tenant view* of the operator until `/admin/users` lands
- **Salah** — pick a date, view/edit prayer entries
- **Quran** — daily reading log
- **Dhikr** — daily counts vs targets
- **Habits** — CRUD habit definitions, mark completions
- **Checklist** — daily checklist
- **Scoring** — global salah scoring config (per operator)
- **System** — server health and version
- **Settings** — operator profile, theme

## What needs new server endpoints

Pages clearly mark themselves as needing future admin endpoints with a
`<RequiresAdminApi>` notice naming the exact route. See
[`design.md` §10.2](../design.md) for the full contract proposal.

## File layout

```
src/
├── app/
│   ├── (auth)/login/        # standalone auth shell
│   ├── (panel)/             # main admin shell (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── salah/
│   │   ├── quran/
│   │   ├── dhikr/
│   │   ├── habits/
│   │   ├── checklist/
│   │   ├── scoring/
│   │   ├── system/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # redirects to /dashboard
├── components/
│   ├── admin/               # sidebar, topbar, page-header, requires-admin-api
│   ├── auth/                # auth-shell, auth-guard
│   ├── layout/              # theme-toggle
│   ├── shared/              # brand-mark
│   └── ui/                  # shadcn primitives
├── hooks/                   # use-auth, use-stats
├── lib/                     # api, auth-api, auth-storage, utils
└── store/                   # auth-store
```
