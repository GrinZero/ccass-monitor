## Why

作为一个生产级项目，没有自动化测试覆盖是无法接受的。当前 CCASS Monitor 缺少单元测试和集成测试，导致代码变更风险高、回归错误频发。引入 Vitest 测试框架可以为所有核心模块提供可靠的测试保障。

## What Changes

- 引入 Vitest 作为测试框架
- 配置 Vitest 环境（TypeScript 支持、匹配器、覆盖率）
- 为 `fetcher.ts` 编写单元测试（HTTP 解析逻辑）
- 为 `cache.ts` 编写单元测试（SQLite 操作）
- 为 `multi-day.ts` 编写单元测试（趋势分析算法）
- 为 `signal.ts` 编写单元测试（信号评分计算）
- 为 `alert.ts` 编写单元测试（告警过滤逻辑）
- 为 `config.ts` 编写单元测试（配置加载）
- 为 `cli.ts` 编写集成测试（CLI 命令解析）

## Capabilities

### New Capabilities

- `vitest-framework`: 引入 Vitest 测试框架并完成基础配置
- `fetcher-unit-tests`: fetcher.ts 单元测试覆盖
- `cache-unit-tests`: cache.ts 单元测试覆盖
- `multi-day-unit-tests`: multi-day.ts 单元测试覆盖
- `signal-unit-tests`: signal.ts 单元测试覆盖
- `alert-unit-tests`: alert.ts 单元测试覆盖
- `config-unit-tests`: config.ts 单元测试覆盖
- `cli-integration-tests`: cli.ts 集成测试覆盖

### Modified Capabilities

<!-- 无现有规格，所有能力均为新增 -->

## Impact

- **新增依赖**: `vitest` (devDependencies)
- **测试文件位置**: `src/**/*.test.ts`
- **覆盖率目标**: 核心模块 80%+ 覆盖率
- **CI/CD**: 测试将在 PR 阶段自动运行
