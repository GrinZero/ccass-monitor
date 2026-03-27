## Context

CCASS Monitor 项目使用 TypeScript 构建，包含多个核心模块：CLI 入口、HTTP 抓取层、SQLite 缓存层、趋势分析引擎、信号生成器和告警引擎。当前项目缺少自动化测试，每次代码变更都存在回归风险。

## Goals / Non-Goals

**Goals:**
- 引入 Vitest 作为测试框架
- 为所有核心模块提供单元测试覆盖
- 实现 80%+ 代码覆盖率
- 测试文件与源码位于同一目录（就近原则）

**Non-Goals:**
- 不引入 E2E 测试
- 不修改现有代码逻辑（测试驱动重构不在本次范围内）
- 不引入代码覆盖率 CI 门槛（可后续添加）

## Decisions

### 1. 选择 Vitest 而非 Jest

**决定**: 使用 Vitest 作为测试框架

**理由**:
- Vitest 与 Vite 集成良好，项目已使用 Vite/TypeScript
- Vitest 支持原生 TypeScript，无需额外配置
- Vitest 的 API 与 Jest 兼容，团队迁移成本低
- Vitest 默认支持 ESM，项目架构更简洁

**备选方案**:
- Jest: 需要额外配置 TypeScript，迁移成本高
- Mocha + Chai: API 较老，使用不广泛

### 2. 测试文件组织

**决定**: 测试文件与源码放在同一目录，使用 `.test.ts` 命名后缀

**理由**:
- 就近原则，便于查找和维护
- 与 Jest/Vitest 社区惯例一致
- 便于 IDE 识别和跳转

**示例**:
```
src/
├── fetcher.ts
├── fetcher.test.ts    # 测试文件
├── cache.ts
├── cache.test.ts      # 测试文件
```

### 3. Mock 策略

**决定**:
- HTTP 请求使用 `vi.mock()` mock `node-fetch` 或 fetch
- SQLite 操作使用 `vi.mock('better-sqlite3')` mock 数据库
- 配置文件使用 `vi.mock()` 隔离

**理由**: 项目核心逻辑依赖外部系统，单元测试需要隔离这些依赖。

### 4. 测试工具库

**决定**: 使用 Vitest 内置工具 + `@vitest/coverage-v8`

**理由**:
- Vitest 内置 `vi`, `describe`, `it`, `expect` 等
- `@vitest/coverage-v8` 提供高性能覆盖率报告
- 无需额外安装测试工具库

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `better-sqlite3` 是原生绑定，难以 mock | 使用数据库内存模式或 `vi.mock()` 深度 mock |
| HTTP 请求测试依赖网络 | 使用 `vi.mock()` 隔离 fetch 调用 |
| 测试覆盖率过高可能降低开发速度 | 覆盖率目标设为 80%，允许灵活调整 |

## Open Questions

- 是否需要在 PR CI 中强制覆盖率门槛？
- 是否需要为工具函数（如 `src/types/index.ts`）单独编写测试？
