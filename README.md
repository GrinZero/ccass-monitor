# CCASS Monitor

港交所披露易机构持仓监控系统。

## 什么是 CCASS？

CCASS（Central Clearing and Settlement System）是港交所的中央结算系统。每周结束后，主要托管机构和参与者会披露其在各上市公司的持仓明细。这些数据被视为重要的机构资金流向指标。

## 这个工具做什么？

追踪汇丰、渣打等主要托管机构的持仓变动，发现异常增减持行为，生成交易信号。

## 真实案例

**查询：小米 (03690) 在汇丰的持仓变动**

```
node src/cli.js signal 03690
```

**结果示例**：

| 指标 | 值 |
|------|-----|
| 综合信号 | **STRONG_BUY** |
| 评分 | 0.918 |
| 置信度 | 90% |

**发现**：

- 2026/03/26 汇丰增持小米约 6,845 万股
- 这是近 12 个交易日以来的最大单日增持（Z-score = 3.06）
- 7 日累计增持 +1.83%

```
创最大单日增持，Z-score=3.06 | 7日+1.83%，趋势平稳 | 当前持仓: 1,961,154,890
```

## 核心功能

- **持仓查询**：查看任意股票在指定托管机构的实时持仓
- **趋势追踪**：多日持仓变化分析，支持 7 日、30 日趋势
- **异常检测**：Z-score 算法识别统计异常的大额增减持
- **信号生成**：综合短期、中期信号生成 STRONG_BUY / BUY / SELL / STRONG_SELL
- **告警监控**：基于自选列表监控多个持仓变动

## 信号评级说明

| 信号 | 含义 |
|------|------|
| STRONG_BUY | 极端异常增持，置信度 ≥ 90% |
| BUY | 显著异常增持或连续多日增持 |
| HOLD | 无明显信号 |
| SELL | 显著异常减持 |
| STRONG_SELL | 极端异常减持 |

## 支持的股票

支持 5 位数字代码或中文名称：小米、腾讯、阿里巴巴、美团、比亚迪、京东、网易、百度、工商银行、中国银行

## 支持的主要参与者

- 汇丰 (C00019)
- 渣打 (C00054)
- 花旗 (C00086)
- 高盛 (C00092)
- 摩根士丹利 (C00108)

## 安装

```bash
# 全局安装
npm install -g ccass-monitor

# 或使用 npx（无需安装）
npx ccass-monitor signal 03690
```

## 快速开始

### 人类用户

```bash
# 查看帮助
ccass --help

# 生成交易信号
ccass signal 03690

# 多日对比
ccass compare 03690 --window 7

# 批量告警
ccass alert --watchlist my-stocks.json
```

### AI Agent 使用

**重要**: AI Agent 使用时，**必须**添加 `--json` 标志获取结构化输出。

```bash
# 分析股票信号（AI 友好输出）
ccass signal 03690 --json

# 批量检查告警
ccass alert --min-confidence 0.6 --json

# 多日趋势对比
ccass compare 03690 --window 14 --json
```

**输出格式**:

```json
{
  "stockCode": "03690",
  "participantId": "C00019",
  "signal": "BUY",
  "confidence": 0.75
}
```

## AI Agent 使用

本工具已优化用于 AI Agent 工作流。所有命令支持 `--json` 标志输出标准 JSON，便于解析和处理。

### MCP/Tool 集成

作为命令行工具，可通过 `exec` 或类似机制在 AI Agent 中调用：

```typescript
// MCP Tool 定义示例
{
  name: "ccass_signal",
  description: "获取港交所股票的机构持仓交易信号",
  inputSchema: {
    type: "object",
    properties: {
      stockCode: { type: "string", description: "股票代码，如 03690" },
      participant: { type: "string", description: "参与者 ID，默认 C00019" }
    },
    required: ["stockCode"]
  },
  handler: async ({ stockCode, participant }) => {
    const result = await execAsync(
      `ccass signal ${stockCode} --participant ${participant || 'C00019'} --json`
    );
    return JSON.parse(result.stdout);
  }
}
```

### Agent 工作流示例

1. **选股分析**: 对自选股批量生成信号
2. **异常检测**: 发现机构异常增减持时主动告警
3. **趋势追踪**: 监控特定机构在目标股票的持仓变化

详细接口文档请参考 [SKILL.md](./SKILL.md)。
