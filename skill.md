# CCASS Monitor Skill

港交所 CCASS 机构持仓监控工具，用于追踪机构投资者的持股变动。

## Tool Description

CCASS (Central Clearing and Settlement System) 是港交所的中央结算系统。本工具监控指定股票的机构持仓变化，生成交易信号。

**用途**: 监控机构投资者（如汇丰、渣打等）在港交所的持仓变动，辅助投资决策。

## Installation

```bash
npm install -g ccass-monitor
# 或
npx ccass-monitor <command>
```

## Commands

### fetch

获取指定股票的 CCASS 持仓数据。

```bash
ccass fetch <stockCode> [--date YYYY/MM/DD] [--participant ID] [--all-participants] [--json]
```

**参数**:
- `stockCode`: 股票代码（5位数字，如 03690）

**选项**:
- `--date`: 查询日期（默认上一交易日）
- `--participant`: 参与者 ID（默认 C00019）
- `--all-participants`: 获取所有参与者数据
- `--json`: 输出 JSON 格式

**输出示例** (--json):
```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "date": "2024/03/06",
  "data": {
    "shareholding": 1500000,
    "rank": 3,
    "percentage": 2.5
  }
}
```

### compare

执行多日对比分析。

```bash
ccass compare <stockCode> [--window DAYS] [--participant ID] [--json]
```

**参数**:
- `stockCode`: 股票代码

**选项**:
- `--window`: 对比窗口天数（默认 7）
- `--participant`: 参与者 ID
- `--json`: 输出 JSON 格式

**输出示例** (--json):
```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "windowDays": 7,
  "trend": "up",
  "changePercentage": 15.3,
  "sma": 1420000,
  "dataPoints": [...]
}
```

### signal

生成交易信号。

```bash
ccass signal <stockCode> [--participant ID] [--json]
```

**参数**:
- `stockCode`: 股票代码

**选项**:
- `--participant`: 参与者 ID
- `--json`: 输出 JSON 格式

**输出示例** (--json):
```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "signal": "BUY",
  "confidence": 0.75,
  "scores": {
    "positionChangeScore": 0.8,
    "momentumScore": 0.7,
    "volumeWeightScore": 0.6,
    "rankingShiftScore": 0.9
  }
}
```

**信号说明**:
- `STRONG_BUY`: confidence >= 0.7 且 score 强烈看涨
- `BUY`: confidence >= 0.3
- `HOLD`: 无明显信号
- `SELL`: confidence <= -0.3
- `STRONG_SELL`: confidence <= -0.7 且 score 强烈看跌

### alert

检查监控列表并生成告警。

```bash
ccass alert [--watchlist FILE] [--min-confidence SCORE] [--json]
```

**选项**:
- `--watchlist`: 监控列表文件（默认 watchlist.json）
- `--min-confidence`: 最低置信度阈值（默认 0.5）
- `--json`: 输出 JSON 格式

**输出示例** (--json):
```json
{
  "alerts": [
    {
      "stockCode": "03690",
      "signal": "BUY",
      "confidence": 0.75
    }
  ],
  "count": 1
}
```

## Configuration

配置文件 `config.yaml`:

```yaml
defaults:
  participant: C00019  # 汇丰
  windowDays: 7

signal:
  weights:
    positionChangeScore: 0.3
    momentumScore: 0.3
    volumeWeightScore: 0.2
    rankingShiftScore: 0.2
  thresholds:
    STRONG_BUY: 0.7
    BUY: 0.3
    SELL: -0.3
    STRONG_SELL: -0.7

stockNames:
  美团: "03690"
  腾讯: "00700"
  # ...
```

## AI Agent Usage

### 调用模式

```typescript
// 使用 npx 执行命令
const result = await execAsync('ccass signal 03690 --participant C00019 --json');

// 解析 JSON 输出
const signal = JSON.parse(result.stdout);
```

### 工作流示例

1. **单股票分析**:
```bash
ccass signal 03690 --json
```

2. **多日趋势对比**:
```bash
ccass compare 03690 --window 14 --json
```

3. **批量告警检查**:
```bash
ccass alert --min-confidence 0.6 --json
```

### 注意事项

- 始终使用 `--json` 标志获取结构化输出
- 参与者 ID 可选，默认使用配置中的 C00019（汇丰）
- 日期格式为 `YYYY/MM/DD`
- 数据库位于 `data/ccass.db`，首次使用会自动初始化

## Constraints

- 仅支持港交所上市的股票
- 数据来源于 HKEx 披露易公开信息
- 交易日定义：周一至周五（不包括香港公众假期）
- 建议配合置信度阈值使用，避免低置信度信号干扰
