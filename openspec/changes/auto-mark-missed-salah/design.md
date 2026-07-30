## Context

Currently, the Salah auto-miss engine in `server/src/modules/salah/salah.service.ts` only settles pending prayers to `missed` if a `SalahDay` MongoDB document already exists for a past date. If a user never logged any prayer or never opened the app on a past date, no document is stored. When querying `getDay` or `listRange` for such past dates, virtual empty days with `fard.status = 'pending'` are returned.

This design extends the auto-miss engine so that any finished day (`dateStr < localDayKey(userTimezone)`) automatically marks all unlogged Fard prayers as `missed` and calculates points accordingly, whether or not a document existed previously.

## Goals / Non-Goals

**Goals:**
- Guarantee that all unlogged Fard prayers on finished past days are marked as `missed` in both queries (`getDay`, `listRange`) and scheduled sweeps (`settleAllEndedDays`).
- Automatically materialize `SalahDay` documents for unlogged past dates when queried or swept by cron.
- Preserve Friday Jummah logic (do not mark Dhuhr as missed if Jummah was logged).
- Compute accurate negative/missed total points for all auto-missed days.

**Non-Goals:**
- Auto-marking prayers as missed for `today` or future dates. Today remains editable until midnight in the user's local timezone.
- Modifying Sunnah/Nafl flags on missed prayers (they remain `false`).

## Decisions

### Decision 1: Dual-layer settlement (Lazy Query Settlement + Scheduled Background Sweep)
- **Choice**: Combine lazy materialization on API queries with scheduled background sweeps in `settleAllEndedDays()`.
- **Rationale**: Lazy settlement on `getDay` and `listRange` ensures immediate user UI consistency without waiting for cron execution. Scheduled background sweeps ensure historical analytics/dashboards are backfilled even if the user never views individual past dates.
- **Alternatives Considered**:
  - *Cron-only materialization*: Leaves unlogged past dates showing `pending` until the cron fires.
  - *On-the-fly virtual response without persistence*: Breaks aggregations and database analytics that read `SalahDay` collection directly.

### Decision 2: Default Missed Day Construction & Range Sweep
- **Choice**: When a past date has no document, construct a default `SalahDay` with all 5 Fard prayers set to `missed` (or 4 Fards + Dhuhr missed on Friday), calculate `totalPoints` using `scoring.fardMissed`, and persist it.
- **Choice for Sweep**: In `settleAllEndedDays`, determine missing dates for each user from `user.createdAt` (local day key) up to yesterday (`cutoff`), and create missing `SalahDay` documents via `bulkWrite`.
- **Rationale**: Bound lookback to `user.createdAt` ensures we don't fabricate infinite history prior to account registration.

## Risks / Trade-offs

- **[Risk] Database write volume on backfill for old accounts** → **Mitigation**: Filter missing dates from `user.createdAt` to yesterday and execute batch `bulkWrite` operations.
- **[Risk] User changing timezone after a day ends** → **Mitigation**: Day comparison is strictly evaluated against user's current configured IANA timezone (`localDayKey(user.timezone)`).

## Migration Plan

1. Deploy updated `salah.service.ts` logic.
2. Run `pnpm backfill:missed-salah` to immediately populate and settle all unlogged past days for existing registered users.
