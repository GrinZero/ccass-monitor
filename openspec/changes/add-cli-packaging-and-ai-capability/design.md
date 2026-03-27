## Context

CCASS Monitor 已迁移到 TypeScript，源码位于 `src/*.ts`。项目使用 pnpm 作为包管理器，Commander.js 作为 CLI 框架，`tsx` 作为开发时运行器。

## Goals / Non-Goals

**Goals:**
- 实现 GitHub Actions 自动化打包和发布
- 提供 npm 全局安装能力 (`npx ccass-monitor` 或全局安装)
- 定义 AI Skill 接口使 Agent 可直接调用
- 重构 README 为 Agent 友好格式

**Non-Goals:**
- 不改变现有 CLI 命令接口和功能
- 不添加新的业务逻辑
- 不支持 Docker 打包（已有其他方案）
- 不实现复杂的 CI/CD（如测试、lint）

## Decisions

### 1. TypeScript 编译策略

**决策**: 发布前编译 TypeScript 到 JavaScript，发布编译后的 `dist/` 目录

**方案选择**:
- 方案 A (采用): `tsc` 编译后发布 `dist/` - 传统 npm 包做法，用户无需安装 tsx
- 方案 B: 保留源码 TypeScript，用户全局安装需自带 tsx - 依赖复杂
- 方案 C: 直接发布源码，让用户在项目内使用 - 不适合 CLI 全局工具

**理由**: CLI 全局工具应开箱即用，编译后发布无需用户环境配置。

**tsconfig.json 关键配置**:
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  }
}
```

### 2. GitHub Actions Release Workflow

**决策**: 使用 `release-drafter` + 手动 trigger 结合的 workflow

**方案选择**:
- 方案 A (采用): `release-drafter` 自动生成 Release Notes + npm publish
- 方案 B: 完全手动配置，需要维护版本号和 Changelog
- 方案 C: 使用 `semantic-release` 自动发布，需要项目遵循严格 commit 规范

**理由**: 平衡自动化和可控性，`release-drafter` 自动生成规范化 changelog，npm publish 实现标准分发。

**Release Workflow 步骤**:
1. Checkout code
2. Setup Node.js + pnpm
3. Run `pnpm install`
4. Run `pnpm run build` (TypeScript → JavaScript)
5. Publish to npm
6. Upload tarball/zip assets to GitHub Release

**package.json bin 字段**:
```json
{
  "bin": {
    "ccass-monitor": "./dist/cli.js"
  },
  "files": ["dist/", "config.yaml"]
}
```

### 3. SKILL.md 接口设计

**决策**: 遵循 Claude Code Skill 规范，创建 `/ccass-monitor` skill

**核心要素**:
- `description`: 工具简短描述
- `commands`: JSON 格式的 CLI 命令定义，供 Agent 解析
- `examples`: Agent 使用示例
- `constraints`: Agent 调用约束

### 4. README Agent 章节

**决策**: 在现有 README 基础上增加独立的 "AI Agent 使用" 章节

**结构**:
```
## AI Agent 使用 (新增)
  - MCP Server/Tool 集成示例
  - Agent 调用工作流
  - 输出格式说明
```

## Risks / Trade-offs

| 风险 | 缓解方案 |
|------|----------|
| npm 包名已被占用 | 使用 `ccass-monitor-hkex` 或类似命名空间 |
| AI Skill 格式变化 | 使用标准格式，可适配未来版本 |
| GitHub token 权限 | 仅在 fork 上测试，release workflow 需手动审批 |
| TypeScript 编译错误导致发布失败 | CI 中运行 `pnpm run build` 验证 |
| `better-sqlite3` native binding 跨平台构建 | 使用 `npm rebuild` 或预编译 binary |
