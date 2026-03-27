## ADDED Requirements

### Requirement: fetcher.ts HTTP 抓取单元测试
fetcher.ts SHALL 实现完整的单元测试覆盖，包括 HTML 解析、错误处理等场景。

#### Scenario: 成功解析 HTML 持仓数据
- **WHEN** fetchCCASSData 收到有效的 HTML 响应
- **THEN** SHALL 返回正确解析的持仓数据数组
- **AND** 包含 stock_code, participant_id, date, shareholding, rank 等字段

#### Scenario: 处理空数据响应
- **WHEN** fetchCCASSData 收到空数据或无数据页面
- **THEN** SHALL 返回空数组
- **AND** 不抛出异常

#### Scenario: HTTP 错误处理
- **WHEN** fetchCCASSData 遇到网络错误
- **THEN** SHALL 抛出统一的错误类型
- **AND** 包含有意义的错误信息

#### Scenario: 解析异常 HTML 格式
- **WHEN** fetchCCASSData 收到非标准 HTML
- **THEN** SHALL 抛出解析错误
- **AND** 不崩溃
