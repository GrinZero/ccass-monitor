---
name: ccass-monitor
description: 港交所 CCASS 机构持仓监控与交易信号工具。当用户询问港股机构持仓、CCASS 数据、机构增减持、交易信号、港股持仓变动时使用本技能。也适用于用户提到具体港股代码（如 03690、00700）或股票中文名（美团、腾讯、小米等）并想了解机构动向的场景。
---

# CCASS Monitor — 港交所机构持仓监控

## 验证工具存在

```bash
ccass -v
npm install -g ccass-monitor # 如果未安装，先安装
```

## 核心概念

## 核心概念

CCASS（中央结算系统）是港交所的股票结算系统，所有券商/托管行的持仓数据每个交易日盘后公开披露。通过追踪特定参与者（如汇丰 C00019）的持仓变动，可以观察机构资金流向。

## 重要：T-1 日规则

CCASS 数据在**盘后**更新（通常在当日收盘后数小时），因此：

- 查询"最新"数据时，**实际可用的最新数据是 T-1（上一个交易日）**
- CLI 默认日期已内置 T-1 逻辑（自动跳过周末），无需手动指定日期
- 如果是周一查询，最新可用数据是上周五
- 用户说"今天的数据"，实际上指的是昨天的 CCASS 数据

## 运行方式

```bash
ccass <command> [options]
```

加 `--json` 可获得结构化 JSON 输出，便于解析。

## 命令速查（按推荐度排序）

### 1. `signal` — 综合交易信号（最推荐）

**最全面的分析命令**，一次调用即返回完整的多维度分析结果：

- 原始数据与统计（30 日历史、均值、标准差、百分位）
- 异常检测（Z-score、极端/显著/一般分级）
- 短期信号（1-5 天连续增减持、3 日动量）
- 中期信号（7 天/30 天趋势、SMA、线性回归方向）
- 综合信号评分（STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL）

```bash
# 查询小米的汇丰持仓信号（默认参与者 C00019）
ccass signal 01810

# 指定参与者
ccass signal 01810 --participant C00019

# JSON 输出
ccass signal 03690 --json
```

**输出包含**:
- `signal`: 综合信号（STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL）
- `confidence`: 置信度 0~1
- `score`: 综合评分
- `shortTerm`: 短期信号详情（连续天数、方向、动量）
- `mediumTerm`: 中期信号详情（7d/30d 变化量与百分比、SMA、趋势方向）
- `anomaly`: 异常检测（Z-score、是否历史极值）
- `rawData`: 每日变化量序列与统计指标
- `summary`: 中文摘要

**场景**：用户想知道某只股票的机构动向、该不该关注，优先用这个命令。

### 2. `compare` — 多日趋势对比

侧重**窗口内的趋势可视化**，适合回答"最近 N 天的持仓走势"类问题。

```bash
# 默认 7 日窗口
ccass compare 03690

# 自定义窗口
ccass compare 03690 --window 14

# 指定参与者 + JSON
ccass compare 00700 --participant C00019 --json
```

**输出包含**:
- `data[]`: 每日持仓、变化量、SMA
- `summary`: 当前持仓、SMA、趋势方向、动量、总变化量与百分比、排名

**与 signal 的区别**：compare 返回每日数据序列（适合画图/列表展示），signal 返回多维度信号评分（适合决策判断）。

### 3. `fetch` — 单日原始数据

获取某日某参与者的**原始持仓数据**，是最基础的数据获取命令。

```bash
# 查询上一交易日的汇丰持仓
ccass fetch 03690

# 指定日期
ccass fetch 03690 --date 2024/03/06

# 获取某日所有参与者持仓排名
ccass fetch 03690 --all-participants --json
```

**场景**：只需要某一天的原始数据，或者想看全部参与者排名时使用。

### 4. `alert` — 批量监控告警

基于 watchlist.json 对多只股票进行批量信号检测，筛选出高置信度的异动。

```bash
ccass alert --watchlist watchlist.json --min-confidence 0.6 --json
```

**场景**：需要一次性扫描多只股票时使用，需要先准备 watchlist.json 文件。

## 常用参与者 ID

| ID | 名称 |
|---|---|
| C00019 | 汇丰（默认） |
| B01274 | 中银国际 |
| C00010 | 花旗 |
| B01136 | 摩根大通 |

不指定 `--participant` 时默认使用 C00019（汇丰），可在 config.yaml 中修改。

## 股票代码

支持 5 位数字代码，也可在 config.yaml 的 `stockNames` 中配置中文名映射：

| 中文名 | 代码 |
|---|---|
| 美团 | 03690 |
| 腾讯 | 00700 |
| 阿里巴巴 | 09988 |
| 小米 | 01810 |
| 比亚迪 | 01211 |
| 京东 | 09618 |

## 信号阈值说明

综合评分基于 4 个指标加权：

- positionChangeScore (0.3) — 持仓变化强度
- momentumScore (0.3) — 动量方向
- volumeWeightScore (0.2) — 量价关系
- rankingShiftScore (0.2) — 排名位移

信号判定：
- **STRONG_BUY**: score >= 0.7
- **BUY**: score >= 0.3
- **HOLD**: -0.3 < score < 0.3
- **SELL**: score <= -0.3
- **STRONG_SELL**: score <= -0.7

## 数据与缓存

- 数据来源：HKEx 披露易网站（公开信息）
- 本地缓存：SQLite (`data/ccass.db`)，已抓取的数据不会重复请求
- 首次使用某股票时会自动抓取历史数据（signal 命令自动抓取 30 天）
- 抓取有限流保护（默认 2 秒间隔），批量抓取需要耐心等待

## 注意事项

- 仅支持港交所上市股票
- 不含港股公众假期判断，周末已自动跳过
- signal 命令需要至少 7 天历史数据才能生成有效信号，数据不足时会自动补抓
