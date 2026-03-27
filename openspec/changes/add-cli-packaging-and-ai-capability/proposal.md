## Why

当前 CCASS Monitor 是一个传统 CLI 工具，缺乏现代化的分发机制和 AI 集成能力。这限制了工具的可访问性和与 AI Agent 工作流的结合。

## What Changes

1. **GitHub Actions 自动化打包**
   - 添加 release workflow，在 tag 时自动构建和发布 npm 包
   - 配置 `bin` 字段使 CLI 全局可用
   - 添加 GitHub Release 产物（tarball、zip）

2. **AI Skill 集成**
   - 创建 `SKILL.md` 使 AI Agent 能够直接调用 CCASS Monitor
   - 定义标准化的工具接口描述
   - 支持 AI Agent 的结构化输出格式

3. **Agent 友好的 README 重构**
   - 添加 AI Agent 使用最佳实践章节
   - 提供 MCP/Tool 集成示例
   - 重构命令文档为 AI 可解析的格式

## Capabilities

### New Capabilities
- `github-release`: GitHub Actions 自动化打包和发布流程
- `ai-skill-interface`: AI Agent 可调用的标准化 Skill 接口
- `agent-readme-guide`: Agent 友好的文档结构和使用指南

### Modified Capabilities
- (无) 现有功能保持不变，仅增加分发和集成能力

## Impact

- **新增文件**: `.github/workflows/release.yml`, `SKILL.md`, 重构后的 `README.md`
- **修改文件**: `package.json` (添加 bin 字段、scripts)
- **新增依赖**: `@actions/core`, `@actions/github` (dev dependency for release workflow)
- **发布方式**: npm package + GitHub Release 双重分发
