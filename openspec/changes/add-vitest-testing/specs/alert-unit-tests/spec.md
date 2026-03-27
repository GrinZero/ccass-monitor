## ADDED Requirements

### Requirement: alert.ts 告警引擎单元测试
alert.ts SHALL 实现完整的单元测试覆盖，包括告警过滤、置信度阈值等场景。

#### Scenario: 置信度过滤
- **WHEN** minConfidence 设置为 0.5
- **THEN** SHALL 仅输出置信度 ≥ 0.5 的告警

#### Scenario: watchlist 匹配
- **WHEN** watchlist 包含目标股票代码
- **THEN** SHALL 生成该股票的告警

#### Scenario: watchlist 外股票过滤
- **WHEN** 股票不在 watchlist 中
- **THEN** SHALL 不生成告警（除非特殊配置）

#### Scenario: 多股票批量告警
- **WHEN** 多个股票同时满足告警条件
- **THEN** SHALL 正确处理并输出所有告警

#### Scenario: 空 watchlist 处理
- **WHEN** watchlist 为空或未定义
- **THEN** SHALL 不输出任何告警
- **AND** 不抛出异常
