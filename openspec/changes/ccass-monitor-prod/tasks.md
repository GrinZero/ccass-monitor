## 1. 项目初始化

- [x] 1.1 创建 `src/` 目录结构（`cache.js`, `fetcher.js`, `multi-day.js`, `signal.js`, `cli.js`, `alert.js`, `config.js`）
- [x] 1.2 创建 `data/` 目录（SQLite 数据库存放位置）
- [x] 1.3 创建 `config.yaml` 配置文件（权重、阈值、默认参与者、告警参数等）
- [x] 1.4 初始化 `package.json`，添加依赖：`better-sqlite3`、`commander`、`js-yaml`
- [x] 1.5 保留原 `hkex_ccass_monitor.js`（暂不删除，作为回滚）

## 2. 配置文件加载（`src/config.js`）

- [x] 2.1 实现 `loadConfig()`：从 `config.yaml` 读取配置，支持默认值覆盖
- [x] 2.2 实现 `getWeights()`：返回信号引擎权重（w1-w4）
- [x] 2.3 实现 `getThresholds()`：返回信号阈值（strongBuy/buy/sell/strongSell）
- [x] 2.4 实现 `getDefaults()`：返回默认参与者 ID 和窗口天数
- [x] 2.5 实现 `getAlertConfig()`：返回告警相关配置（minConfidence、minVolumeRatio、rankShiftThreshold）

## 3. SQLite 缓存层（`src/cache.js`）

- [x] 3.1 实现 `initDatabase()`：创建数据库、WAL 模式、表结构（含索引）
- [x] 3.2 实现 `getHolding(stockCode, participantId, date)`：缓存读取
- [x] 3.3 实现 `setHolding(record)`：缓存写入（UPSERT）
- [x] 3.4 实现 `getRange(stockCode, participantId, startDate, endDate)`：范围查询
- [x] 3.5 实现 `setFetchLog()`：记录抓取日志
- [x] 3.6 实现 `getFetchLog(stockCode, date)`：检查是否已有成功抓取记录

## 4. 核心抓取逻辑（`src/fetcher.js`，复用原脚本）

- [x] 4.1 将原 `hkex_ccass_monitor.js` 中的 `httpRequest`、`extractHiddenFields`、`parseTable`、`searchCCASS` 移入 `src/fetcher.js`
- [x] 4.2 实现 `fetchOne(stockCode, participantId, date)`：单次抓取，失败重试（次数从 config.yaml 读取）
- [x] 4.3 实现 `fetchAndCache(stockCode, participantId, date)`：抓取后自动写入缓存
- [x] 4.4 实现 `fetchRange(stockCode, participantId, startDate, endDate)`：批量抓取，间隔从 config.yaml 读取（防限流）

## 5. 多日分析引擎（`src/multi-day.js`）

- [x] 5.1 实现 `analyzeWindow(stockCode, participantId, windowDays)`：主入口
- [x] 5.2 实现 `computeDeltas(data[])`：计算每日变化量
- [x] 5.3 实现 `computeSMA(data[], window)`：计算简单移动平均
- [x] 5.4 实现 `computeTrend(data[])`：线性回归斜率 + 趋势方向
- [x] 5.5 实现 `computeMomentum(deltas[])`：动量分数（连续同向天数占比）
- [x] 5.6 实现 `computeVolatility(deltas[])`：波动率（标准差/均值）
- [x] 5.7 实现 `getRanking(stockCode, date)`：获取某日全体参与者排名
- [x] 5.8 实现 `formatCompareOutput()`：输出标准 JSON 结构

## 6. 交易信号引擎（`src/signal.js`）

- [x] 6.1 实现 `generateSignal(stockCode, participantId)`：主入口，权重从 config.yaml 读取
- [x] 6.2 实现 `computePositionChangeScore(current, history)`：Z-score 计算
- [x] 6.3 实现 `computeMomentumScore(deltas[])`：动量子分数
- [x] 6.4 实现 `computeVolumeWeightScore(change, avgDailyVolume)`：量价加权
- [x] 6.5 实现 `computeRankingShiftScore(currentRank, avgRank)`：排名位移
- [x] 6.6 实现 `combineScores(weights, scores)`：加权求和，权重从 config.yaml 读取
- [x] 6.7 实现 `determineAction(score)`：阈值从 config.yaml 读取，判断买入/卖出/持有
- [x] 6.8 实现 `computeConfidence(subScores[])`：置信度计算
- [x] 6.9 实现 `formatSignalOutput()`：输出标准 JSON（含中文 summary）

## 7. CLI 接口（`src/cli.js`）

- [x] 7.1 使用 `commander` 实现主程序入口
- [x] 7.2 实现 `fetch` 子命令（含 `--date`、`--participant`、`--all-participants`、`--output` 选项）
- [x] 7.3 实现 `compare` 子命令（含 `--window`、`--participant`、`--output` 选项）
- [x] 7.4 实现 `signal` 子命令（含 `--participant` 选项，权重从 config.yaml 读取）
- [x] 7.5 实现 `alert` 子命令（含 `--watchlist`、`--min-confidence` 选项）
- [x] 7.6 所有子命令统一 JSON 输出格式
- [x] 7.7 统一错误处理：stderr + exit code 1

## 8. 告警引擎（`src/alert.js`）

- [x] 8.1 实现 `loadWatchlist(file)`：读取并验证 watchlist.json
- [x] 8.2 实现 `checkAll(watchlist)`：遍历监控列表，调用 signal.js，支持任意参与者列表
- [x] 8.3 实现 `filterByVolume(change, avgVolume)`：量价过滤（阈值从 config.yaml 读取）
- [x] 8.4 实现 `detectRankShift(rankToday, rankAvg)`：排名变化检测（阈值从 config.yaml 读取）
- [x] 8.5 实现 `generateAlert(type, data)`：生成告警 JSON
- [x] 8.6 实现告警类型：`STRONG_ACCUMULATION`、`STRONG_DISTRIBUTION`、`RANK_UP`、`RANK_DOWN`
- [x] 8.7 创建默认 `watchlist.json.example` 示例文件

## 9. Skill 文件（`skill.md`）

- [x] 9.1 编写 `skill.md` frontmatter（name, description, arguments）
- [x] 9.2 实现自然语言 → CLI 子命令的映射逻辑
- [x] 9.3 实现中文股票名称 → 代码的映射表（美团→03690，腾讯→00700 等常见股）
- [x] 9.4 实现参数提取（日期、天数、置信度、参与者 ID 等）
- [x] 9.5 实现 JSON 输出 → 自然语言的格式化（用于 AI 回复用户）
- [x] 9.6 编写 Skill 使用说明和使用示例

## 10. 集成测试与验证

- [ ] 10.1 测试缓存命中（重复查询不发送网络请求）
- [ ] 10.2 测试 7 日窗口分析输出正确结构
- [ ] 10.3 测试信号生成（已有数据跑出 BUY/SELL/HOLD）
- [ ] 10.4 测试 CLI 各子命令的 --help 输出
- [ ] 10.5 测试 alert 子命令（基于 watchlist 过滤，支持多参与者）
- [ ] 10.6 端到端验证：fetch → compare → signal → alert 全链路

## 11. 文档与收尾

- [ ] 11.1 更新 `README.md`：新 CLI 使用说明
- [ ] 11.2 删除旧 `hkex_ccass_monitor.js`（确认新系统正常后）
- [ ] 11.3 确认所有 spec 场景均已实现（或记录未实现原因）
