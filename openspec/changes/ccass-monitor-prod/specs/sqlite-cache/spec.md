## ADDED Requirements

### Requirement: Database Schema

The system SHALL use SQLite with WAL mode for CCASS data caching with the following schema:

```
stocks (code TEXT PRIMARY KEY, name TEXT, last_updated INTEGER)
participants (id TEXT PRIMARY KEY, name TEXT, address TEXT, last_updated INTEGER)
daily_holdings (id INTEGER PRIMARY KEY, stock_code TEXT, participant_id TEXT,
                date TEXT, shareholding INTEGER, percentage TEXT,
                rank INTEGER, fetch_time INTEGER)
fetch_log (id INTEGER PRIMARY KEY, stock_code TEXT, date TEXT,
           fetch_time INTEGER, success INTEGER, error TEXT)
```

#### Scenario: Schema initialization
- **WHEN** cache module is first imported
- **THEN** it SHALL create the database file at `data/ccass.db` if not exists
- **AND** it SHALL enable WAL mode
- **AND** it SHALL create all tables with proper indexes

### Requirement: Cache read
- The system SHALL check cache before making HTTP requests to HKEX
- Cache lookup key is `(stock_code, participant_id, date)`
- Cache HIT returns data immediately without network request
- Cache MISS triggers fetch and stores result

#### Scenario: Cache hit
- **WHEN** `getHolding(stockCode, participantId, date)` is called
- **AND** the entry exists in `daily_holdings`
- **THEN** it SHALL return the cached record immediately
- **AND** it SHALL NOT make any HTTP request

#### Scenario: Cache miss
- **WHEN** `getHolding(stockCode, participantId, date)` is called
- **AND** the entry does not exist in cache
- **THEN** it SHALL return null
- **AND** caller SHALL trigger a fetch and store result

### Requirement: Cache write
- The system SHALL store fetched CCASS data into SQLite after each successful fetch
- Each record SHALL include `fetch_time` timestamp (Unix ms)
- Multiple participants for same stock/date are stored as separate rows

#### Scenario: Store single holding record
- **WHEN** a CCASS holding record is successfully fetched
- **THEN** it SHALL be inserted into `daily_holdings` with current timestamp
- **AND** if record exists (same stock, participant, date), it SHALL be replaced (UPSERT)

### Requirement: Incremental fetch
- The system SHALL support fetching only missing dates (no full history)
- When given a date range, it SHALL only fetch dates not in cache

#### Scenario: Incremental fetch for date range
- **WHEN** `fetchRange(stockCode, participantId, startDate, endDate)` is called
- **THEN** it SHALL first query cache for all dates in range
- **AND** it SHALL only fetch dates not in cache
- **AND** it SHALL respect rate limiting between requests
