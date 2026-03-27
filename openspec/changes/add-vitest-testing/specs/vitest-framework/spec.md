## ADDED Requirements

### Requirement: Vitest 框架基础配置
项目 SHALL 引入 Vitest 作为测试框架，并完成基础配置。

#### Scenario: Vitest 安装配置
- **WHEN** 开发者运行 `pnpm add -D vitest @vitest/coverage-v8`
- **THEN** Vitest 及覆盖率工具 SHALL 被添加到 devDependencies

#### Scenario: Vitest 配置文件创建
- **WHEN** 开发者创建 `vitest.config.ts` 配置文件
- **THEN** 配置 SHALL 包含 TypeScript 支持、测试目录配置、覆盖率报告配置

#### Scenario: package.json 测试脚本
- **WHEN** 开发者配置 `package.json` 中的 test 脚本
- **THEN** `pnpm test` SHALL 运行 Vitest
- **AND** `pnpm test -- --coverage` SHALL 运行带覆盖率的测试
