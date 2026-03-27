## ADDED Requirements

### Requirement: multi-day.ts 趋势分析单元测试
multi-day.ts SHALL 实现完整的单元测试覆盖，包括 SMA 计算、趋势分析、动量计算等场景。

#### Scenario: 简单移动平均计算
- **WHEN** calculateSMA([10, 20, 30, 40, 50], 3) 被调用
- **THEN** SHALL 返回 [20, 30, 40]
- **AND** 计算公式正确 (window 内数据之和 / window)

#### Scenario: SMA 窗口大于数据长度
- **WHEN** calculateSMA([10, 20], 5) 被调用
- **THEN** SHALL 返回空数组

#### Scenario: 线性回归趋势计算
- **WHEN** calculateTrend([...]) 被调用
- **THEN** SHALL 返回趋势斜率和方向
- **AND** 能正确识别上升、下降、平稳趋势

#### Scenario: 动量指标计算
- **WHEN** calculateMomentum([...], period) 被调用
- **THEN** SHALL 返回动量值
- **AND** 正确反映价格变化速度

#### Scenario: 多日数据分析
- **WHEN** analyzeMultiDay(stockCode, data) 被调用
- **THEN** SHALL 返回包含 SMA、趋势、动量的综合分析结果
