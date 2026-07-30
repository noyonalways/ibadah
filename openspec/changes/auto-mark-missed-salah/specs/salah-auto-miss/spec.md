## ADDED Requirements

### Requirement: Automatic settlement of unlogged past Salah prayers
The system SHALL automatically mark all unlogged or pending Fard prayers as `missed` for any day that has finished in the user's local timezone, even if no prayer was logged or no `SalahDay` document exists for that day.

#### Scenario: Fetching a past date with no existing database document
- **WHEN** `getDay` is called for a past date (`dateStr < localDayKey(timezone)`) where no `SalahDay` document exists
- **THEN** the system SHALL return and materialize a `SalahDay` document with all unlogged Fard prayers marked as `missed` and total points computed accordingly.

#### Scenario: Scheduled background sweep of past unlogged days
- **WHEN** `settleAllEndedDays` scheduled sweep executes
- **THEN** the system SHALL iterate through active users and create or update `SalahDay` documents for past dates with unlogged or pending Fard prayers, setting their status to `missed`.

#### Scenario: Range queries covering past dates
- **WHEN** `listRange` is called for a date range containing past dates
- **THEN** the system SHALL ensure all unlogged past days within the range are settled to `missed` status and persisted.

### Requirement: Preservation of Friday Jummah exception during auto-settlement
The system SHALL handle Friday auto-miss settlement according to whether Jummah was logged.

#### Scenario: Past Friday with Jummah logged
- **WHEN** auto-settlement runs on a past Friday where Jummah has been logged
- **THEN** Dhuhr SHALL NOT be marked as `missed`, while any other pending Fard prayers SHALL be marked as `missed`.

#### Scenario: Past Friday with no Jummah or Dhuhr logged
- **WHEN** auto-settlement runs on a past Friday where neither Jummah nor Dhuhr has been logged
- **THEN** Dhuhr (along with Fajr, Asr, Maghrib, and Isha) SHALL be marked as `missed`.
