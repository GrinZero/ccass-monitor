---
name: ccass
description: 查询港交所 CCASS 机构持仓数据，生成交易信号，支持多日趋势分析和智能告警
arguments: <stockCode> [command] [options]
---

# CCASS 港股持仓监控 Skill

## 功能概览

`/ccass` 提供港交所 CCASS 机构持仓数据的查询、多日趋势分析、交易信号生成和告警功能。

## 命令映射

| 自然语言示例 | CLI 子命令 | 说明 |
|---|---|---|
| `查询 03690 汇丰 2024/03/06 持仓` | `fetch 03690 --date 2024/03/06 --participant C00019` | 拉取单条持仓数据 |
| `对比美团最近7天` | `compare 03690 --window 7` | 多日趋势分析 |
| `生成腾讯的交易信号` | `signal 00700` | 生成买入/卖出信号 |
| `检查我的监控列表` | `alert` | 基于 watchlist 告警 |

## 子命令

### fetch — 拉取持仓数据

```
fetch <stockCode> [--date YYYY/MM/DD] [--participant ID] [--all-participants]
```

**参数**:
- `stockCode`: 5位股票代码（如 03690）

**选项**:
- `--date`: 查询日期，默认上一交易日
- `--participant`: 参与者 ID（默认汇丰 C00019）
- `--all-participants`: 获取全部参与者 top20

### compare — 多日对比分析

```
compare <stockCode> [--window 7] [--participant ID]
```

**选项**:
- `--window`: 窗口天数（默认 7）
- `--participant`: 参与者 ID

### signal — 生成交易信号

```
signal <stockCode> [--participant ID]
```

**说明**: 基于 T-1 盘后数据，生成 T+1 交易信号。

**信号类型**: `STRONG_BUY` / `BUY` / `HOLD` / `SELL` / `STRONG_SELL`

### alert — 告警检查

```
alert [--watchlist file] [--min-confidence 0.5]
```

**说明**: 读取 watchlist.json，对配置的股票和参与者进行信号检查，仅输出超过置信度阈值的告警。

## 股票名称映射

可用中文名称代替代码:

| 名称 | 代码 |
|---|---|
| 美团 | 03690 |
| 腾讯 | 00700 |
| 阿里巴巴 | 09988 |
| 小米 | 01810 |
| 比亚迪 | 01211 |

## 使用示例

### 查询持仓
```
/ccass 查询 03690 汇丰今日持仓
```

### 对比趋势
```
/ccass 对比 03690 最近30天的汇丰持仓变化
```

### 生成信号
```
/ccass 生成美团的交易信号
```

### 告警检查
```
/ccass 检查我的监控列表
```

## 输出格式

所有命令输出 JSON 格式，便于 AI 解析：

```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "date": "2024/03/06",
  "signal": "BUY",
  "confidence": 0.82,
  "score": 0.65,
  "indicators": {
    "positionChangeScore": 0.8,
    "momentumScore": 0.6,
    "volumeWeightScore": 0.5,
    "rankingShiftScore": 0.3
  },
  "summary": "汇丰连续5日增持美团，持仓增加12%，信号：买入，置信度：82%"
}
```

## 自然语言解析规则

AI 调用时应将自然语言转换为对应 CLI 命令：

1. **股票代码识别**: 5位数字或中文名称（如"美团"→"03690"）
2. **日期识别**: "今日"→上一交易日，"昨天"→前一交易日，或直接识别 YYYY/MM/DD
3. **天数识别**: "7天"/"一周"→7，"30天"/"一个月"→30
4. **信号方向**: "买入信号"/"增持"→BUY/STRONG_BUY，"卖出"/"减持"→SELL/STRONG_SELL
5. **置信度**: 0-1 之间的小数

## 最佳调用时间

CCASS 数据在每个交易日（T）16:00 后发布，建议在 16:00-17:00 调用，获取 T-1 的完整数据。
