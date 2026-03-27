# CCASS Monitor

港交所 CCASS 机构持仓监控工具 — 追踪机构资金流向，生成交易信号。


## 效果展示

<img width="700" height="534" alt="image" src="https://github.com/user-attachments/assets/228a91ef-a77d-40f1-9108-37f6b0da1825" />

<img width="1345" height="863" alt="image" src="https://github.com/user-attachments/assets/20514efc-361e-4e23-92a7-cc3db64a3c64" />


## 安装

```bash
npm install -g ccass-monitor 
ccass signal 03690 --json # 首次运行时间可能较久，需要爬取较长时间数据
```

## Agent 接入

通过 `npx skills add` 安装 CCASS Monitor 技能，即可让 AI Agent 获得港交所机构持仓监控能力：

```bash
npx skills add GrinZero/ccass-monitor
```

安装后 AI Agent 将自动了解：
- 所有可用命令及参数（fetch/compare/signal/alert）
- `--json` 结构化输出格式
- 信号评分体系与阈值
- 常用股票代码和参与者 ID

## License

MIT
