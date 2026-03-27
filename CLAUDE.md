# CLAUDE.md

> 请你确保输出中文

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CCASS Monitor 是港交所 CCASS 机构持仓监控工具，支持多日趋势分析和交易信号生成。数据来源于 HKEx 披露易网站。

## 常用命令

```bash
# 安装依赖（使用 pnpm，因项目配置了 pnpm-workspace）
pnpm install

# 运行 CLI（使用 tsx 直接执行 TypeScript）
pnpm start
tsx src/cli.ts <command>

# 单条命令示例
tsx src/cli.ts fetch 03690 --date 2024/03/06 --participant C00019
tsx src/cli.ts compare 03690 --window 7
tsx src/cli.ts signal 01810 --participant C00019
tsx src/cli.ts alert --watchlist my-stocks.json

# 运行测试（Node.js 内置 test runner）
pnpm test
tsx --test src/

# 运行 ESLint
npx eslint src/**/*.ts

# TypeScript 类型检查
npx tsc --noEmit
```

## 架构概览

```
src/
├── cli.ts          # Commander.js CLI 入口，4个子命令：fetch/compare/signal/alert
├── fetcher.ts      # HTTP 抓取层，向 HKEx 披露易发送 POST 请求解析 HTML
├── cache.ts        # SQLite 缓存层（better-sqlite3），持久化持仓数据
├── config.ts       # config.yaml 配置加载
├── multi-day.ts    # 多日趋势分析引擎（移动平均、线性回归趋势、动量）
├── signal.ts       # 交易信号生成器（4指标加权评分）
├── alert.ts        # 告警引擎，基于 watchlist 和置信度过滤
└── types/
    └── index.ts    # TypeScript 类型定义
```

## 数据流

1. **抓取层 (fetcher.ts)** → 向 HKEx 披露易发送 GET/POST 请求，解析 HTML 表格
2. **缓存层 (cache.ts)** → SQLite 持久化，含 daily_holdings、fetch_log 等表
3. **分析层 (multi-day.ts)** → 基于缓存数据计算 SMA、趋势、动量
4. **信号层 (signal.ts)** → 4 指标加权：positionChangeScore(0.3) + momentumScore(0.3) + volumeWeightScore(0.2) + rankingShiftScore(0.2)
5. **告警层 (alert.ts)** → 基于 watchlist.json 生成告警，仅输出置信度 ≥ minConfidence 的信号

## 关键配置 (config.yaml)

- `defaults.participant`: 默认参与者 ID（汇丰 C00019）
- `signal.weights`: 信号评分权重
- `signal.thresholds`: STRONG_BUY ≥ 0.7，BUY ≥ 0.3，SELL ≤ -0.3，STRONG_SELL ≤ -0.7
- `stockNames`: 中文名称→股票代码映射

## 数据库

SQLite 数据库位于 `data/ccass.db`，包含：
- `daily_holdings`: 持仓数据（stock_code, participant_id, date, shareholding, rank）
- `fetch_log`: 抓取历史记录
- `stocks`, `participants`: 基础数据表

**注意**: `data/` 目录和 `.db` 文件在 .gitignore 中，不提交到版本控制。

## 股票代码

支持 5 位数字代码或中文名称（美团/腾讯/阿里巴巴/小米/比亚迪/京东/网易/百度/工商银行/中国银行）

## 依赖说明

- `better-sqlite3`: SQLite 原生绑定，需编译，pnpm 配置了 onlyBuiltDependencies
- `commander`: CLI 框架（自带 TypeScript 类型）
- `js-yaml`: YAML 配置解析
- `tsx`: TypeScript 运行时，直接执行 TS 文件无需编译
