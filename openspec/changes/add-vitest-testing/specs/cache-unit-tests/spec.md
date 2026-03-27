## ADDED Requirements

### Requirement: cache.ts SQLite 缓存单元测试
cache.ts SHALL 实现完整的单元测试覆盖，包括数据存取、缓存查找等场景。

#### Scenario: 存储持仓数据
- **WHEN** storeHoldings 被调用时
- **THEN** SHALL 将数据正确写入 SQLite daily_holdings 表

#### Scenario: 按股票代码和日期查询
- **WHEN** getHoldings('03690', '2024/03/06') 被调用
- **THEN** SHALL 返回该股票在该日期的持仓数据数组

#### Scenario: 按参与者查询
- **WHEN** getHoldingsByParticipant('C00019', '2024/03/06') 被调用
- **THEN** SHALL 返回该参与者的所有持仓数据

#### Scenario: 获取日期范围数据
- **WHEN** getHoldingsInRange('03690', startDate, endDate) 被调用
- **THEN** SHALL 返回指定日期范围内的所有持仓数据

#### Scenario: 缓存未命中
- **WHEN** 请求的数据不存在于缓存中
- **THEN** SHALL 返回空数组
- **AND** 不抛出异常
