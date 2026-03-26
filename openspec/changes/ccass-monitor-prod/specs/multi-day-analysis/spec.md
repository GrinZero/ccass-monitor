## ADDED Requirements

### Requirement: Multi-day window fetch

The system SHALL support fetching CCASS data across configurable N-day windows, defaulting to 7-day and 30-day rolling windows.

#### Scenario: Fetch 7-day window
- **WHEN** `analyzeWindow(stockCode, participantId, windowDays=7)` is called
- **THEN** it SHALL fetch all trading days from (today - 6) to today
- **AND** it SHALL return an array of daily holding records

#### Scenario: Fetch 30-day window
- **WHEN** `analyzeWindow(stockCode, participantId, windowDays=30)` is called
- **THEN** it SHALL fetch all trading days from (today - 29) to today
- **AND** it SHALL return an array of daily holding records

### Requirement: Daily delta calculation

The system SHALL compute the daily change (delta) in shareholding for each day in the window.

#### Scenario: Daily delta for 7 days
- **WHEN** a 7-day window is analyzed
- **THEN** each day's delta SHALL be calculated as: `shareholding_t - shareholding_t-1`
- **AND** the first day of the window SHALL have delta = 0 (no prior day)
- **AND** deltas SHALL be stored alongside the raw data

### Requirement: Moving average computation

The system SHALL compute the moving average of shareholding over the window period.

#### Scenario: 7-day moving average
- **WHEN** a 7-day window is analyzed
- **THEN** a 7-day simple moving average (SMA) SHALL be computed: `sum(last 7 days) / 7`
- **AND** the current holding vs SMA ratio SHALL be calculated

#### Scenario: 30-day moving average
- **WHEN** a 30-day window is analyzed
- **THEN** a 30-day SMA SHALL be computed
- **AND** a 7-day SMA within the 30-day window SHALL also be computed

### Requirement: Trend indicator

The system SHALL compute trend indicators for the window:

- **Trend direction**: `+1` (increasing), `0` (neutral), `-1` (decreasing) based on linear regression slope
- **Momentum score**: percentage of days with same-direction deltas in the window
- **Volatility score**: standard deviation of daily deltas / average daily delta

#### Scenario: Uptrend detection
- **WHEN** a stock's holding has increased 5 out of 7 days
- **THEN** momentum score SHALL be > 0.6
- **AND** trend direction SHALL be `+1`

#### Scenario: Downtrend detection
- **WHEN** a stock's holding has decreased 5 out of 7 days
- **THEN** momentum score SHALL be < -0.6
- **AND** trend direction SHALL be `-1`

### Requirement: Comparison output

The system SHALL output structured comparison data:

```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "windowDays": 7,
  "data": [
    { "date": "2024/03/01", "shareholding": 1000000, "delta": 0, "sma7": 980000 }
  ],
  "summary": {
    "currentHolding": 1050000,
    "sma": 980000,
    "currentVsSma": 1.07,
    "momentum": 0.71,
    "trend": "increasing",
    "totalChange": 50000,
    "totalChangePct": 5.0
  }
}
```

#### Scenario: JSON structured output
- **WHEN** `compare()` is called with valid data
- **THEN** it SHALL return a JSON object matching the above structure
- **AND** all numeric fields SHALL be numbers (not strings)
