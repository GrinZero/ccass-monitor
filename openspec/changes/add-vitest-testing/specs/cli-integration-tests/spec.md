## ADDED Requirements

### Requirement: cli.ts 集成测试
cli.ts SHALL 实现完整的集成测试覆盖，包括命令解析、参数验证、输出格式化等场景。

#### Scenario: fetch 命令执行
- **WHEN** 运行 `tsx src/cli.ts fetch 03690 --date 2024/03/06 --participant C00019`
- **THEN** SHALL 正确解析参数并调用 fetcher
- **AND** 输出格式化正确

#### Scenario: compare 命令执行
- **WHEN** 运行 `tsx src/cli.ts compare 03690 --window 7`
- **THEN** SHALL 正确调用多日分析并输出对比结果

#### Scenario: signal 命令执行
- **WHEN** 运行 `tsx src/cli.ts signal 01810 --participant C00019`
- **THEN** SHALL 正确生成交易信号

#### Scenario: alert 命令执行
- **WHEN** 运行 `tsx src/cli.ts alert --watchlist my-stocks.json`
- **THEN** SHALL 正确读取 watchlist 并输出告警

#### Scenario: 无效命令处理
- **WHEN** 运行未定义的命令
- **THEN** SHALL 显示帮助信息
- **AND** 不崩溃

#### Scenario: 缺少必需参数
- **WHEN** fetch 命令缺少必需参数
- **THEN** SHALL 显示错误信息
- **AND** 退出码非零
