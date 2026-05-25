# Ibadah — Journey Towards Allah

A modern, full-featured Islamic tracking application to track Salah, Quran, Dhikr, daily habits, and checklists with rich progress visualizations, streaks, and goals.

> **Tagline:** Journey Towards Allah

---

## Tech Stack

### Client (`client/`)
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (New York style)
- **next-intl** for i18n (English now; Bangla & Arabic ready, RTL-aware)
- **TanStack Query** (server state) + **Zustand** (client state)
- **Recharts** for charts/heatmaps
- **next-themes** (light/dark mode)

### Server (`server/`)
- **Node.js** (≥ 20) + **Express 5** + **TypeScript**
- **MongoDB Atlas** + **Mongoose 8**
- **Zod** for validation, **JWT** for auth, **bcryptjs** for password hashing
- Hardening: `helmet`, `cors`, `express-rate-limit`, structured error handling

### Architecture
- Clean **client–server** separation; backend is REST.
- Server uses a modular **feature-folder** pattern (each module owns its model, routes, controller, service, validation).
- Built **i18n-first** and **SEO-first** (metadata API, sitemap, robots, locale routing).

---

## Project Structure

```
ibadah/
├── client/                      # Next.js frontend
│   ├── messages/                # i18n message catalogs (en, bn, ar)
│   └── src/
│       ├── app/[locale]/        # Locale-prefixed App Router
│       ├── components/          # ui, landing, layout, shared
│       ├── lib/                 # api client, auth helpers, utils
│       ├── hooks/, store/, types/
│       └── i18n/                # next-intl config
└── server/                      # Express backend
    └── src/
        ├── config/              # env validation, db connection
        ├── middleware/          # auth, error, validate, notFound
        ├── modules/             # auth, user, salah, quran, dhikr, habit, checklist, stats
        ├── routes/              # route aggregator
        └── utils/               # ApiError, catchAsync, sendResponse, token
```

---

## Getting Started

### Prerequisites
- Node.js **≥ 20** (LTS recommended)
- A **MongoDB Atlas** cluster (or local MongoDB)
- Package manager: `npm`, `pnpm`, or `yarn`

### 1. Clone & install

```bash
git clone https://github.com/noyonalways/ibadah.git
cd ibadah

# Install both client and server
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

# Client
cp client/.env.example client/.env
# Fill in NEXT_PUBLIC_API_URL (e.g. http://localhost:5000/api/v1)
```

### 3. Run in development

```bash
# Terminal 1 — server (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — client (http://localhost:3000)
cd client
npm run dev
```

---

## Salah Scoring Rules

| Status | Points |
| --- | --- |
| On time (Awwal Waqt) | **+30** |
| On time (mid window) | **+20** |
| On time (last window) | **+10** |
| Late / Qaza | **0** |
| Missed | **−10** |
| Sunnah / Nafil (per prayer) | **+5** |
| Witr | **+5** |

Configurable via `server/src/modules/salah/salah.constants.ts`.

---

## Internationalization (i18n)

- Default locale: **`en`**
- Planned locales: **`bn`** (Bangla), **`ar`** (Arabic, RTL)
- Locale routing handled via `next-intl` middleware. Add new strings to `client/messages/<locale>.json`.

---

## SEO

- Per-route `generateMetadata` with localized titles/descriptions
- `sitemap.ts` + `robots.ts`
- Open Graph & Twitter card defaults
- Semantic HTML, accessible color contrast

---

## Roadmap

- [x] Architecture & scaffolding
- [x] Auth (email/password, JWT)
- [x] Salah module (reference impl)
- [ ] Full Quran / Dhikr / Habit / Checklist modules
- [ ] Charts: weekly/monthly bars, daily heatmap, calendar view
- [ ] Streak engine + weekly/monthly goals
- [ ] PWA + offline support
- [ ] Bangla & Arabic localization
- [ ] Google OAuth

---

## License

MIT
