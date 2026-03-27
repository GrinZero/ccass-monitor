## 为什么需要这个变更

项目目前使用原生 JavaScript 编写，缺乏类型安全和编译时校验。随着项目规模增长，这增加了运行时错误的风险，也使重构更加困难。迁移到 TypeScript 可以带来：
- 编译时类型检查，在运行前捕获错误
- 更好的 IDE 支持（自动补全、重构工具）
- 通过类型注解实现代码自文档化
- 现代 Node.js 项目的社区最佳实践

## 变更内容

- **将所有源文件从 `.js` 转换为 `.ts`**（cli、fetcher、cache、config、multi-day、signal、alert）
- **添加 TypeScript 配置**（`tsconfig.json`），启用 strict 模式
- **配置 tsx 作为运行时**用于开发和执行
- **添加 ESLint TypeScript 支持**（`@typescript-eslint/eslint-plugin`、`eslint-config-prettier`）
- **安装 `@types/*` 包**为 better-sqlite3、commander、js-yaml 提供类型
- **添加内部数据结构类型定义**（HoldingRecord、Participant、SignalResult 等）
- **BREAKING**: 入口文件从 `src/cli.js` 改为 `src/cli.ts`（但 CLI 别名保持不变）
- **BREAKING**: 运行时从 `node` 改为 `tsx` 执行 CLI 命令

## 能力

### 新增能力

- `typescript-migration`: 使用 tsx 运行时、严格类型检查和 ESLint 集成，将项目从 JavaScript 完全迁移到 TypeScript

## 影响范围

**受影响的文件:**
- `src/cli.js` → `src/cli.ts`
- `src/fetcher.js` → `src/fetcher.ts`
- `src/cache.js` → `src/cache.ts`
- `src/config.js` → `src/config.ts`
- `src/multi-day.js` → `src/multi-day.ts`
- `src/signal.js` → `src/signal.ts`
- `src/alert.js` → `src/alert.ts`
- `package.json`（新增依赖：typescript、tsx、@types/*、eslint）
- `tsconfig.json`（新增文件）
- `eslint.config.js`（新增文件）

**无需求变更** —— 这是一次纯粹的语言迁移，保持现有功能不变。
