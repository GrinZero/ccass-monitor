## ADDED Requirements

### Requirement: Watchlist configuration

The alert engine SHALL support a watchlist file (`watchlist.json`) that defines which stocks and arbitrary participants to monitor. Any CCASS participant ID can be monitored.

```json
{
  "stocks": [
    { "code": "03690", "name": "美团", "participants": ["C00019", "C00023"] },
    { "code": "00700", "name": "腾讯", "participants": ["C00019"] }
  ],
  "globalParticipants": ["C00019"],
  "minConfidence": 0.5
}
```

#### Scenario: Load watchlist
- **WHEN** alert engine starts
- **AND** `watchlist.json` exists
- **THEN** it SHALL load and validate the configuration
- **AND** it SHALL monitor all stocks and participants in the list

#### Scenario: Arbitrary participant
- **WHEN** user adds a new participant ID to watchlist.json
- **THEN** alert engine SHALL monitor that participant for all listed stocks
- **AND** no code changes are required

### Requirement: Multi-indicator alert scoring

An alert SHALL be generated when multiple indicators exceed thresholds simultaneously (AND logic for high confidence):

- `positionChangeScore > 0.5` AND `momentumScore > 0.5` → strong accumulation signal
- `positionChangeScore < -0.5` AND `momentumScore < -0.5` → strong distribution signal

Single indicator above 0.8 MAY also generate an alert (standalone strong signal).

#### Scenario: Strong accumulation alert
- **WHEN** a participant's holding increases > 15% in one day
- **AND** this is the 5th consecutive day of increase
- **THEN** an alert SHALL be generated with `STRONG_ACCUMULATION`

#### Scenario: Strong distribution alert
- **WHEN** a participant's holding drops > 20% in one day
- **AND** momentum has turned negative
- **THEN** an alert SHALL be generated with `STRONG_DISTRIBUTION`

### Requirement: Volume-weighted alert filter

The alert engine SHALL filter out alerts where the absolute shareholding change is below a threshold (from `config.yaml`). This prevents alerting on illiquid stocks with tiny absolute changes.

The threshold `alert.minVolumeRatio` (default 0.001 = 0.1%) is the minimum ratio of `holdingChange / averageDailyVolume`.

#### Scenario: Volume filter
- **WHEN** holding change is 1000 shares
- **AND** average daily volume is 10,000,000 shares
- **AND** ratio = 0.0001 < config.minVolumeRatio (0.001)
- **THEN** no alert SHALL be generated (change is noise-level)

### Requirement: Ranking shift alert

The alert engine SHALL detect significant rank changes. The threshold `alert.rankShiftThreshold` (from `config.yaml`, default 5) defines the minimum rank movement:

- Participant moves up N+ ranks in single day → `RANK_UP` alert
- Participant moves down N+ ranks in single day → `RANK_DOWN` alert

#### Scenario: Ranking improvement alert
- **WHEN** a participant moves from rank 15 to rank 8 in one day
- **AND** 15 - 8 = 7 >= config.rankShiftThreshold
- **THEN** a `RANK_UP` alert SHALL be generated

### Requirement: Alert output format

```json
{
  "alertId": "uuid",
  "type": "STRONG_ACCUMULATION",
  "stockCode": "03690",
  "stockName": "美团",
  "participantId": "C00019",
  "participantName": "汇丰",
  "date": "2024/03/01",
  "confidence": 0.82,
  "summary": "汇丰连续5日增持美团，累计增持股数 120,000 (占日均成交 2.3%)",
  "indicators": {
    "positionChangeScore": 0.8,
    "momentumScore": 0.9,
    "volumeWeightScore": 0.6,
    "rankingShiftScore": 0.4
  },
  "action": "CONSIDER_BUY"
}
```

### Requirement: Alert routing

Alerts SHALL be output to stdout in JSON format for integration with external systems (Slack, email, etc.)

#### Scenario: JSON alert output
- **WHEN** an alert is triggered
- **THEN** it SHALL be written to stdout as JSON
- **AND** external scripts can pipe to Slack/email integration
