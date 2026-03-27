## ADDED Requirements

### Requirement: signal.ts 交易信号单元测试
signal.ts SHALL 实现完整的单元测试覆盖，包括信号生成、评分计算等场景。

#### Scenario: STRONG_BUY 信号生成
- **WHEN** generateSignal 返回综合评分 ≥ 0.7
- **THEN** SHALL 生成 STRONG_BUY 信号
- **AND** 置信度为对应评分

#### Scenario: BUY 信号生成
- **WHEN** generateSignal 返回综合评分在 [0.3, 0.7) 区间
- **THEN** SHALL 生成 BUY 信号

#### Scenario: SELL 信号生成
- **WHEN** generateSignal 返回综合评分在 (-0.3, 0.3) 区间
- **THEN** SHALL 生成 NEUTRAL 信号

#### Scenario: STRONG_SELL 信号生成
- **WHEN** generateSignal 返回综合评分 ≤ -0.7
- **THEN** SHALL 生成 STRONG_SELL 信号

#### Scenario: 各指标权重计算
- **WHEN** calculateWeightedScore 被调用
- **THEN** SHALL 正确应用配置中的权重
- **AND** positionChangeScore: 0.3, momentumScore: 0.3, volumeWeightScore: 0.2, rankingShiftScore: 0.2

#### Scenario: 边界值处理
- **WHEN** 评分恰好为 0.3 或 -0.3
- **THEN** SHALL 按阈值边界正确分类
