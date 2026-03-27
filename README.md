# CCASS Monitor

港交所 CCASS 机构持仓监控工具 — 追踪机构资金流向，生成交易信号。

## 安装

```bash
npm install -g ccass-monitor 
ccass signal 03690 --json
```

## AI / Agent 接入

通过 `npx skills add` 安装 CCASS Monitor 技能，即可让 AI Agent 获得港交所机构持仓监控能力：

```bash
npx skills add ccass-monitor
```

安装后 AI Agent 将自动了解：
- 所有可用命令及参数（fetch/compare/signal/alert）
- `--json` 结构化输出格式
- 信号评分体系与阈值
- 常用股票代码和参与者 ID

## License

MIT
