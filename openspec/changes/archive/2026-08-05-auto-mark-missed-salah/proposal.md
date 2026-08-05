## Why

Currently, when a day ends in the user's timezone, prayers are only automatically marked as `missed` if the user logged at least one prayer on that day (which created a `SalahDay` document). If a user does not open the app or does not log any prayer on a past day, no document exists, causing past unlogged days to remain as `pending` when queried or rendered. Users expect all unlogged waqt Fard prayers on finished/past days to automatically settle to `missed` status, regardless of whether they interacted with the app or logged any prayer on that date.

## What Changes

- Update `salahService.getDay` to return/settle all Fard prayers as `missed` for any finished past day (`dateStr < localDayKey(userTimezone)`), even when no `SalahDay` document exists yet.
- Update `salahService.listRange` to settle missing past days in range queries so all past unlogged days report all Fard prayers as `missed`.
- Update `salahService.settleAllEndedDays` (cron job & backfill script) to sweep past dates from user account creation date up to yesterday, auto-creating/settling `SalahDay` records for unlogged past days.
- Ensure Friday Jummah logic is preserved (if Jummah was logged on a Friday, Dhuhr is not marked missed; if no Jummah/Dhuhr was logged on a past Friday, both Dhuhr and other Fard prayers mark as missed unless Jummah was performed).

## Capabilities

### New Capabilities
- `salah-auto-miss`: Automatic settlement of unlogged past Salah prayers to `missed` status across all past dates after day completion, with or without prior user interaction.

### Modified Capabilities
<!-- None -->

## Impact

- **Backend**: `server/src/modules/salah/salah.service.ts`, `server/src/jobs/scheduler.ts`, `server/src/scripts/backfillMissedSalah.ts`.
- **Database**: `SalahDay` collection will materialize/settle records for past unlogged dates upon user query or cron sweep.
- **Frontend / Client**: `client/src/lib/salah/salah-api.ts` and dashboard/salah cards will receive accurate `missed` status for all past dates without client logic changes.
