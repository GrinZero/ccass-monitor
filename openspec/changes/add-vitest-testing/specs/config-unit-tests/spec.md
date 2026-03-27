## ADDED Requirements

### Requirement: config.ts 配置加载单元测试
config.ts SHALL 实现完整的单元测试覆盖，包括配置解析、默认值、错误处理等场景。

#### Scenario: 成功加载 config.yaml
- **WHEN** loadConfig() 被调用
- **THEN** SHALL 返回包含 defaults, signal, stockNames 等字段的配置对象

#### Scenario: 默认参与者配置
- **WHEN** 配置中指定 defaults.participant
- **THEN** SHALL 正确返回该值

#### Scenario: 信号阈值配置
- **WHEN** 配置中指定 signal.thresholds
- **THEN** SHALL 正确返回 STRONG_BUY ≥ 0.7, BUY ≥ 0.3 等阈值

#### Scenario: 股票名称映射
- **WHEN** 配置中指定 stockNames
- **THEN** SHALL 正确返回中文名称到股票代码的映射

#### Scenario: 配置文件缺失
- **WHEN** config.yaml 文件不存在
- **THEN** SHALL 使用默认值
- **AND** 不抛出致命错误
