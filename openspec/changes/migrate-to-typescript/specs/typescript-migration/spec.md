## 新增需求

### 需求: TypeScript 项目配置
项目 MUST 配置完整的 TypeScript 开发环境，包括 tsconfig.json、ESLint 配置和必要的类型定义包。

#### Scenario: tsconfig.json 配置正确
- **WHEN** 运行 `npx tsc --init`
- **THEN** 生成包含 `strict: true`、`target: ES2020`、`module: NodeNext`、`skipLibCheck: true` 的配置文件

#### Scenario: ESLint 与 TypeScript 集成
- **WHEN** 运行 `pnpm lint`
- **THEN** ESLint 使用 `@typescript-eslint/parser` 检查所有 `.ts` 文件，并启用 `@typescript-eslint/recommended` 规则

### 需求: tsx 运行时支持
项目 MUST 使用 tsx 作为运行时，支持直接执行 TypeScript 文件。

#### Scenario: CLI 命令使用 tsx 执行
- **WHEN** 运行 `pnpm start signal 03690`
- **THEN** 系统使用 tsx 执行 `src/cli.ts`，输出与原有 JavaScript 版本相同的 JSON 结果

#### Scenario: 测试命令支持 TypeScript
- **WHEN** 运行 `pnpm test`
- **THEN** 测试使用 tsx 加载 TypeScript 源文件并执行

### 需求: 类型定义完整性
项目 MUST 为所有内部数据结构和外部库提供完整的类型定义。

#### Scenario: 内部数据结构类型化
- **WHEN** 转换 `cache.ts` 到 TypeScript
- **THEN** 定义 `HoldingRecord`、`Participant`、`DailyHoldingsRow` 等接口，并在函数签名中使用

#### Scenario: 外部库类型可用
- **WHEN** 安装 `@types/better-sqlite3`、`@types/commander`、`@types/js-yaml`
- **THEN** 类型检查器能正确识别这些库的类型

### 需求: 现有功能保持不变
项目 MUST 在迁移过程中保持所有现有功能的输出和行为完全一致。

#### Scenario: fetch 命令输出不变
- **WHEN** 执行 `node src/cli.js fetch 03690 --date 2024/03/06 --participant C00019`
- **AND** 执行 `tsx src/cli.ts fetch 03690 --date 2024/03/06 --participant C00019`
- **THEN** 两次执行的 JSON 输出结构完全一致

#### Scenario: signal 命令输出不变
- **WHEN** 执行 `node src/cli.js signal 03690`
- **AND** 执行 `tsx src/cli.ts signal 03690`
- **THEN** 两次执行的 JSON 输出包含相同的字段：`stockCode`、`signal`、`confidence`、`summary`

#### Scenario: compare 命令输出不变
- **WHEN** 执行 `node src/cli.js compare 03690 --window 7`
- **AND** 执行 `tsx src/cli.ts compare 03690 --window 7`
- **THEN** 两次执行的 JSON 输出包含相同的 `data` 数组和 `summary` 对象

#### Scenario: alert 命令输出不变
- **WHEN** 执行 `node src/cli.js alert --watchlist watchlist.json`
- **AND** 执行 `tsx src/cli.ts alert --watchlist watchlist.json`
- **THEN** 两次执行的告警 JSON 结构完全一致

### 需求: 文件转换完整性
项目 MUST 将所有 JavaScript 源文件转换为 TypeScript。

#### Scenario: 所有源文件已转换
- **WHEN** 检查 `src/` 目录
- **THEN** 存在 `cli.ts`、`fetcher.ts`、`cache.ts`、`config.ts`、`multi-day.ts`、`signal.ts`、`alert.ts`
- **AND** 不存在对应的 `.js` 文件

#### Scenario: 类型定义文件存在
- **WHEN** 检查 `src/` 目录
- **THEN** 存在 `types/index.ts` 文件，包含所有内部接口定义
