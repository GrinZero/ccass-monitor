## Context

现有 `hkex_ccass_monitor.js` 是单文件脚本，直接请求 HKEX 网站，零持久化，无多日分析能力，CLI 输出为格式化文本而非结构化数据。在生产环境中无法作为交易信号系统使用：

- 无缓存，重复请求浪费资源且容易被限流
- 仅支持两日对比，无法做趋势分析
- 无交易信号生成能力
- 无 AI 可调用接口
- 告警逻辑仅用简单阈值（变化 > 10%）

## Goals / Non-Goals

**Goals:**
- 将 CCASS 监控能力建设为可持续使用的生产级工具
- SQLite 缓存实现数据持久化和历史回溯
- 支持 7 日、30 日多日窗口趋势分析
- 生成可执行的 T+1 交易信号（买入/卖出/持有），附带置信度
- 完善的 CLI + AI Skill 接口
- 智能告警基于金融最佳实践，而非简单阈值

**Non-Goals:**
- 不实现自动交易（信号仅供决策参考，不自动下单）
- 不做技术面分析（不引入 K 线、均线等）
- 不做实时监控（仅支持 T-1 盘后数据）
- 不支持港交所原生 API（继续抓取网页，不申请 API 权限）

## Decisions

### 1. SQLite 缓存（`better-sqlite3`）而非文件缓存

**决定**：使用 `better-sqlite3` 作为缓存层，同步 API，性能高。

**替代方案**：
- `sqlite3`：异步 API， callback 地狱
- `lowdb` / JSON 文件：无查询能力，历史分析效率低
- `Redis`：引入额外服务，本地开发体验差

**理由**：CCASS 数据结构化、查询模式简单（按股票+日期+参与者 ID 查），SQLite 完全满足。`better-sqlite3` 同步 API 与 Node 主线程配合更简单，无需处理异步复杂度。

### 2. 模块化重构而非保留单文件

**决定**：将原脚本重构为 `src/cache.js`、`src/multi-day.js`、`src/signal.js`、`src/cli.js`、`src/alert.js` 五个模块。

**理由**：缓存逻辑、多日分析、信号生成、CLI、告警是不同关注点，单文件难以维护。新模块直接被 CLI 和 Skill 调用，职责清晰。

### 3. CLI 框架选型（`commander`）

**替代方案**：
- `oclif`：过度工程，复杂
- `yargs`：还行但不如 commander 简洁
- 原生 `process.argv`：需手写帮助和子命令解析

**理由**：`commander` 足够简洁，支持子命令、选项、帮助文档，与 Skill 配合良好。

### 4. 配置文件使用 YAML 格式

**决定**：使用 `config.yaml` 作为配置文件（而非 JSON），包含信号权重、默认参与者、告警阈值等所有可配置项。

**替代方案**：
- JSON：可读性差，注释支持弱
- 环境变量：适合敏感信息，不适合结构化配置
- TOML：Node.js 生态支持较弱

**理由**：`yaml` 格式可读性好、支持注释、分层结构，适合存放信号引擎权重等多层级配置。Node.js 可用 `js-yaml` 库解析。

**config.yaml 结构**：
```yaml
signal:
  weights:
    positionChangeScore: 0.3
    momentumScore: 0.3
    volumeWeightScore: 0.2
    rankingShiftScore: 0.2
  thresholds:
    strongBuy: 0.7
    buy: 0.3
    sell: -0.3
    strongSell: -0.7

defaults:
  participant: "C00019"    # 汇丰
  windowDays: 7

alert:
  minConfidence: 0.5
  minVolumeRatio: 0.001    # 持仓变化 / 日均成交量 最小比值
  rankShiftThreshold: 5     # 排名位移告警阈值

fetch:
  retryCount: 2
  retryDelayMs: 3000
  rateLimitMs: 2000
```

### 5. 交易信号判断逻辑（非阈值）

**决定**：综合多个指标打分，非单一阈值触发。权重从 `config.yaml` 读取。

**信号引擎公式**：
```
SignalScore = w1 * positionChangeScore
            + w2 * momentumScore
            + w3 * volumeWeightScore
            + w4 * rankingShiftScore
```

- `positionChangeScore`：持仓变化 % 与历史均值（过去 30 天）的 Z-score
- `momentumScore`：连续 N 天同向变化的天数，机构持续增仓/减仓是强信号
- `volumeWeightScore`：持仓变化量 / 日均成交量的比值，避免"成交量极低的暴涨暴跌"
- `rankingShiftScore`：在全体参与者中的排名位移

**信号输出**（阈值从 config.yaml 读取）：
- Score > 阈值.strongBuy → **强烈买入**
- Score > 阈值.buy → **买入**
- Score < 阈值.strongSell → **强烈卖出**
- Score < 阈值.sell → **卖出**
- 其他 → **持有**

### 6. Skill 文件格式

**决定**：使用 Claude Code Skill 格式（`skill.md`），在顶部使用 `---` 分隔的前台信息（name, description, arguments），下方是使用说明。

**理由**：Skill 格式对 AI Agent 友好，AI 能自然语言调用所有 CLI 功能，无需记忆子命令细节。

## Risks / Trade-offs

**[Risk] HKEX 网页结构变化 → Mitigation：建立监控，若解析失败自动告警；支持配置选择器

**[Risk] 数据延迟**：CCASS T-1 数据通常在 T 日 16:00 后发布 → Mitigation：CLI 默认在交易日 16:00 后运行，Skill 提示用户最佳调用时间

**[Risk] SQLite 并发写入**：多进程同时抓取 → Mitigation：SQLite WAL 模式；CLI 运行时加文件锁

**[Risk] 置信度评分主观性**：信号评分权重是经验值 → Mitigation：权重存于 `config.yaml`，用户可根据回测结果调整

**[Risk] 告警疲劳**：每日推送所有股票所有参与者 → Mitigation：基于 watchlist 机制，仅监控用户配置的股票和参与者

## Migration Plan

1. **阶段一**：搭建 SQLite 缓存层（`src/cache.js`），完成数据持久化
2. **阶段二**：实现多日分析引擎（`src/multi-day.js`），支持 7/30 日窗口
3. **阶段三**：实现信号评分引擎（`src/signal.js`），综合评分非阈值，权重从 config.yaml 读取
4. **阶段四**：重构 CLI（`src/cli.js`），迁移所有子命令
5. **阶段五**：编写 Skill 文件（`skill.md`），完成 AI 接口
6. **阶段六**：编写告警引擎（`src/alert.js`），接入 watchlist

**回滚策略**：保留原 `hkex_ccass_monitor.js` 文件，新系统验收通过后再删除

## Open Questions

~~1. **权重配置**：信号评分的权重（w1-w4）是硬编码还是读配置文件？配置文件格式用 JSON 还是 YAML？~~ → **已确定**：读 `config.yaml`

~~2. **多参与者监控**：目前仅监控汇丰，未来是否需要支持任意参与者列表？~~ → **已确定**：支持任意参与者列表，由 watchlist.json 配置

~~3. **数据保留策略**：SQLite 数据保留多长时间？~~ → **已确定**：不设置保留策略，数据永久保留

~~4. **Skill 调用约定**：Skill 如何调用 CLI——子进程 spawn 还是直接 require 模块？~~ → **已确定**：Skill 通过子进程 spawn 调用 CLI（解耦优先）
