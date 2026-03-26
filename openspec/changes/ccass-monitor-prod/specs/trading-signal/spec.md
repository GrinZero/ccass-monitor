## ADDED Requirements

### Requirement: Signal generation from T-1 data

The system SHALL consume T-1 post-market CCASS data and generate T+1 trading signals (buy/sell/hold) with confidence scores.

#### Scenario: Generate signal for single participant
- **WHEN** `generateSignal(stockCode, participantId)` is called on a trading day T
- **THEN** it SHALL use CCASS data released at T-1 16:00
- **AND** it SHALL return a signal object with action, confidence, and reasoning

### Requirement: Signal score computation

The signal score SHALL be computed as a weighted combination of four indicators:

```
SignalScore = w1 * positionChangeScore + w2 * momentumScore + w3 * volumeWeightScore + w4 * rankingShiftScore
```

Weights `w1-w4` SHALL be read from `config.yaml`. Each sub-score ranges from -1.0 to +1.0.

#### Scenario: Position change Z-score
- **WHEN** calculating `positionChangeScore`
- **THEN** it SHALL compute Z-score: `(currentChange - meanHistoricalChange) / stdDevHistoricalChange`
- **AND** Z-score SHALL be normalized to [-1, +1] range using sigmoid function

#### Scenario: Momentum score
- **WHEN** calculating `momentumScore`
- **THEN** it SHALL count consecutive days of same-direction change
- **AND** score SHALL be: `+1.0` if 7+ consecutive days same direction, `0.0` if neutral, proportional between

#### Scenario: Volume-weighted score
- **WHEN** calculating `volumeWeightScore`
- **THEN** it SHALL compute: `holdingChange / averageDailyVolume`
- **AND** large changes in low-volume stocks SHALL score higher (institutional impact more significant)

#### Scenario: Ranking shift score
- **WHEN** calculating `rankingShiftScore`
- **THEN** it SHALL compare participant's rank today vs 7-day average rank
- **AND** moving up 3+ ranks SHALL produce positive score

### Requirement: Signal output format

The system SHALL output signals in this format:

```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "date": "2024/03/01",
  "signal": "BUY",
  "confidence": 0.82,
  "score": 0.65,
  "indicators": {
    "positionChangeScore": 0.8,
    "momentumScore": 0.6,
    "volumeWeightScore": 0.5,
    "rankingShiftScore": 0.3
  },
  "summary": "汇丰连续5日增持美团，持仓增加12%，Z-score 2.3，动量强劲",
  "generatedAt": 1709308800000
}
```

### Requirement: Signal thresholds

Signal action thresholds SHALL be read from `config.yaml`. Default values if not configured:

- Score > 0.7 → `STRONG_BUY` (强烈买入)
- Score > 0.3 → `BUY` (买入)
- Score < -0.7 → `STRONG_SELL` (强烈卖出)
- Score < -0.3 → `SELL` (卖出)
- Otherwise → `HOLD` (持有)

#### Scenario: Strong buy signal
- **WHEN** computed SignalScore > threshold.strongBuy (from config.yaml)
- **THEN** signal action SHALL be `STRONG_BUY`
- **AND** confidence SHALL be > 0.7

#### Scenario: Hold signal
- **WHEN** computed SignalScore is between thresholds.sell and thresholds.buy
- **THEN** signal action SHALL be `HOLD`

### Requirement: Confidence scoring

The confidence score SHALL reflect the strength of evidence:

- Confidence = average of absolute sub-scores that contributed to the signal
- High confidence requires 3+ indicators aligned
- Low confidence (< 0.3) when only 1 indicator triggered

#### Scenario: High confidence signal
- **WHEN** 4 indicators all agree (all positive or all negative)
- **THEN** confidence SHALL be > 0.75

#### Scenario: Low confidence signal
- **WHEN** only 1 indicator triggers
- **THEN** confidence SHALL be < 0.4
