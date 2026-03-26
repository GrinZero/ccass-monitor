## Why

现有的 `hkex_ccass_monitor.js` 是一个单用途脚本，仅能在单一日期对单只股票获取单个参与机构（汇丰）的持股数据。它无法作为生产级交易信号系统使用——缺乏数据持久化、多日趋势分析、自动化告警以及 AI 可调用接口。需要将它演进为一个**缓存优先、支持多日分析**的工具，基于机构持仓变化生成可执行的交易信号。

## What Changes

- **SQLite 缓存层**：所有抓取的 CCASS 数据本地 SQLite 存储，避免重复网络请求，支持历史数据分析。
- **多日趋势引擎**：一次对比 7 日和 30 日滚动窗口内的机构持仓变化，而非仅看单日快照。
- **交易信号生成**：消费 T-1 盘后 CCASS 数据，生成 T+1 可执行信号（买入/卖出/持有）。
- **生产级 CLI**：结构化命令行，支持子命令（`fetch`、`compare`、`signal`、`alert`），输出 JSON，统一错误处理。
- **AI 可调用 Skill**：提供 `/ccass` 斜杠命令，向 AI Agent 暴露所有功能，参数契约清晰。
- **智能告警系统**：综合金融最佳实践检测大额交易——量价加权分析、动量信号、机构增仓/减仓模式，而非简单阈值判断。

## Capabilities

### New Capabilities

- `sqlite-cache`：CCASS 数据的持久化 SQLite 数据库，包含股票、参与者、每日持仓、抓取元数据的表结构。支持 TTL 失效机制和增量抓取。
- `multi-day-analysis`：获取并对比 N 日窗口（默认 7 天和 30 天）。计算日间变化量、移动平均线和趋势指标。将计算后指标与原始数据一同存储。
- `trading-signal`：消费 T-1 盘后 CCASS 数据，生成 T+1 交易信号（买入/卖出/持有），附带置信度评分。信号逻辑综合：持仓变化幅度、动量、量价加权、参与者排名变化。
- `cli-interface`：结构化 CLI，含子命令：`fetch`（拉取数据）、`compare`（多日对比分析）、`signal`（生成交易信号）、`alert`（监控告警）。输出 JSON 格式。
- `ccass-skill`：AI 可调用的 `/ccass` skill，以自然语言调用所有 CLI 功能，兼容 Claude Code skill 系统。
- `alert-engine`：智能告警引擎，综合判断：(1) 持仓变化 % 与历史均值对比；(2) 量价加权信号（与日均成交量对比）；(3) 排名位移检测（参与者在排名中上升/下降）；(4) 多参与者相关性（多个机构是否出现相同模式）。

## Impact

- **新增文件**：`src/cache.js`、`src/multi-day.js`、`src/signal.js`、`src/cli.js`、`skill.md`、`data/ccass.db`（SQLite）
- **修改文件**：`hkex_ccass_monitor.js` → 重构为 `src/` 下的各模块
- **新增依赖**：`better-sqlite3`（或 `sqlite3`）、`commander`（CLI）、自定义指标库（信号逻辑）
- **Breaking**：CLI 输出格式从文本改为 JSON；旧脚本由 `src/cli.js` 替代
