## 1. Vitest 框架安装与配置

- [ ] 1.1 安装 vitest 和 @vitest/coverage-v8 依赖
- [ ] 1.2 创建 vitest.config.ts 配置文件（TypeScript 支持、测试目录、覆盖率配置）
- [ ] 1.3 更新 package.json 添加 test 和 coverage 脚本
- [ ] 1.4 验证 vitest 配置正确运行

## 2. fetcher.ts 单元测试

- [ ] 2.1 创建 src/fetcher.test.ts 测试文件
- [ ] 2.2 Mock node-fetch 模块
- [ ] 2.3 编写 HTML 解析成功场景测试
- [ ] 2.4 编写空数据响应场景测试
- [ ] 2.5 编写 HTTP 错误处理场景测试
- [ ] 2.6 编写解析异常 HTML 格式场景测试
- [ ] 2.7 运行测试验证全部通过

## 3. cache.ts 单元测试

- [ ] 3.1 创建 src/cache.test.ts 测试文件
- [ ] 3.2 Mock better-sqlite3 模块
- [ ] 3.3 编写 storeHoldings 存储测试
- [ ] 3.4 编写 getHoldings 按股票和日期查询测试
- [ ] 3.5 编写 getHoldingsByParticipant 按参与者查询测试
- [ ] 3.6 编写 getHoldingsInRange 日期范围查询测试
- [ ] 3.7 编写缓存未命中场景测试
- [ ] 3.8 运行测试验证全部通过

## 4. multi-day.ts 单元测试

- [ ] 4.1 创建 src/multi-day.test.ts 测试文件
- [ ] 4.2 编写 calculateSMA 简单移动平均测试
- [ ] 4.3 编写 SMA 窗口大于数据长度边界测试
- [ ] 4.4 编写 calculateTrend 线性回归趋势测试
- [ ] 4.5 编写 calculateMomentum 动量计算测试
- [ ] 4.6 编写 analyzeMultiDay 多日分析综合测试
- [ ] 4.7 运行测试验证全部通过

## 5. signal.ts 单元测试

- [ ] 5.1 创建 src/signal.test.ts 测试文件
- [ ] 5.2 编写 generateSignal STRONG_BUY 信号测试（评分 ≥ 0.7）
- [ ] 5.3 编写 generateSignal BUY 信号测试（评分 [0.3, 0.7)）
- [ ] 5.4 编写 generateSignal NEUTRAL 信号测试（评分 (-0.3, 0.3)）
- [ ] 5.5 编写 generateSignal STRONG_SELL 信号测试（评分 ≤ -0.7）
- [ ] 5.6 编写 calculateWeightedScore 权重计算测试
- [ ] 5.7 编写边界值处理测试（恰好 0.3, -0.3）
- [ ] 5.8 运行测试验证全部通过

## 6. alert.ts 单元测试

- [ ] 6.1 创建 src/alert.test.ts 测试文件
- [ ] 6.2 编写置信度过滤测试（minConfidence 阈值）
- [ ] 6.3 编写 watchlist 匹配测试
- [ ] 6.4 编写 watchlist 外股票过滤测试
- [ ] 6.5 编写多股票批量告警测试
- [ ] 6.6 编写空 watchlist 处理测试
- [ ] 6.7 运行测试验证全部通过

## 7. config.ts 单元测试

- [ ] 7.1 创建 src/config.test.ts 测试文件
- [ ] 7.2 编写 loadConfig 成功加载测试
- [ ] 7.3 编写默认参与者配置测试
- [ ] 7.4 编写信号阈值配置测试
- [ ] 7.5 编写股票名称映射测试
- [ ] 7.6 编写配置文件缺失时默认值处理测试
- [ ] 7.7 运行测试验证全部通过

## 8. cli.ts 集成测试

- [ ] 8.1 创建 src/cli.test.ts 测试文件
- [ ] 8.2 Mock 子模块（fetcher, multi-day, signal, alert）
- [ ] 8.3 编写 fetch 命令解析测试
- [ ] 8.4 编写 compare 命令解析测试
- [ ] 8.5 编写 signal 命令解析测试
- [ ] 8.6 编写 alert 命令解析测试
- [ ] 8.7 编写无效命令处理测试
- [ ] 8.8 编写缺少必需参数场景测试
- [ ] 8.9 运行测试验证全部通过

## 9. 覆盖率验证

- [ ] 9.1 运行 pnpm test -- --coverage
- [ ] 9.2 检查核心模块覆盖率是否达到 80%+
- [ ] 9.3 如未达标，针对性补充测试
