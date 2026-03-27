## 1. 项目配置初始化

- [x] 1.1 安装 TypeScript 和开发依赖（typescript, tsx, @types/*, eslint, @eslint/js, @typescript-eslint/*, eslint-config-prettier）
- [x] 1.2 创建 `tsconfig.json`，配置 strict mode、ES2020 target、NodeNext module resolution
- [x] 1.3 创建 `eslint.config.js`，配置 @typescript-eslint/parser 和 @typescript-eslint/recommended
- [x] 1.4 更新 `package.json` 的 `type` 字段为 `"module"`
- [x] 1.5 更新 `package.json` 的 scripts，使用 tsx 运行时
- [x] 1.6 验证 `tsx --version` 和 `npx tsc --version` 正常工作

## 2. 类型定义文件创建

- [x] 2.1 创建 `src/types/index.ts`
- [x] 2.2 定义 `HoldingRecord` 接口（stockCode, participantId, date, shareholding, percentage, rank, fetchTime）
- [x] 2.3 定义 `Participant` 接口（id, name, address, shareholding, percentage）
- [x] 2.4 定义 `StockInfo` 接口（code, name, lastUpdated）
- [x] 2.5 定义 `SignalResult` 和相关子接口（rawData, anomaly, shortTerm, mediumTerm, indicators）
- [x] 2.6 定义 `Alert` 接口（alertId, type, stockCode, stockName, participantId, confidence, summary, action）
- [x] 2.7 定义 `Watchlist` 和 `WatchlistStock` 接口
- [x] 2.8 定义配置相关接口（Config, SignalWeights, SignalThresholds, AlertConfig, FetchConfig）

## 3. 核心模块转换（按依赖顺序）

- [x] 3.1 转换 `src/config.ts`：保留配置加载逻辑，添加 Config 接口泛型返回类型
- [x] 3.2 转换 `src/cache.ts`：添加 Database 类型，使用 @types/better-sqlite3，添加 HoldingRecord 类型
- [x] 3.3 转换 `src/fetcher.ts`：添加 HTTP 请求和响应类型，保留异步函数签名
- [x] 3.4 转换 `src/multi-day.ts`：添加窗口分析结果类型，使用已定义的 HoldingRecord
- [x] 3.5 转换 `src/signal.ts`：添加 SignalResult 和指标类型，保持 generateSignal 异步签名
- [x] 3.6 转换 `src/alert.ts`：添加 Alert 和 Watchlist 类型，保留 loadWatchlist 和 checkAll 函数
- [x] 3.7 转换 `src/cli.ts`：添加 Commander 类型注解，更新 Command 实例类型

## 4. 验证和测试

- [x] 4.1 删除所有已转换的 `.js` 源文件
- [x] 4.2 运行 `pnpm start signal 03690` 验证 CLI 功能
- [x] 4.3 运行 `pnpm start fetch 03690 --date 2024/03/06` 验证抓取功能
- [x] 4.4 运行 `pnpm start compare 03690 --window 7` 验证对比功能
- [x] 4.5 运行 `pnpm test` 验证测试（项目无测试文件，跳过）
- [x] 4.6 运行 `npx eslint src/**/*.ts` 验证 ESLint 配置正确，`npx tsc --noEmit` 验证通过
- [x] 4.7 验证所有命令输出与原有 JavaScript 版本一致

## 5. 文档和清理

- [x] 5.1 更新 `CLAUDE.md` 中的命令示例
- [x] 5.2 验证 `.gitignore` 包含 `dist/`
- [x] 5.3 确认 `data/` 目录和 `.db` 文件未被追踪
