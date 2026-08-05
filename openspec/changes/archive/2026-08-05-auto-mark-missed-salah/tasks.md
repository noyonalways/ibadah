## 1. Backend Salah Service Auto-Miss Enhancement

- [x] 1.1 Update `salahService.getDay` to auto-settle and persist missing past days (`dateStr < localDayKey(timezone)`) with all Fard prayers set to `missed`.
- [x] 1.2 Update `salahService.listRange` to handle missing past dates within a requested date range, settling and materializing them as `missed`.
- [x] 1.3 Update `salahService.settleAllEndedDays` to sweep unlogged past dates from `user.createdAt` up to yesterday for active users and bulk-create/settle `SalahDay` documents for any missing or pending past days.

## 2. Testing & Backfill Verification

- [x] 2.1 Test `getDay` and `listRange` queries for past dates with no prior document to verify they return all Fard prayers marked as `missed` with accurate total points.
- [x] 2.2 Test `settleAllEndedDays` cron execution / backfill script to verify historical unlogged dates are correctly populated as missed.
