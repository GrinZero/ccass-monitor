## 背景

CCASS Monitor 项目是一个使用原生 JavaScript 编写的 Node.js CLI 工具（7 个源模块）。项目使用：
- `better-sqlite3` 实现 SQLite 缓存
- `commander` 实现 CLI 参数解析
- `js-yaml` 实现配置加载
- Node.js 内置 `http`/`https` 实现 HTTP 请求

当前项目结构：
```
src/
├── cli.js          # 入口，Commander.js CLI
├── fetcher.js      # HKEx HTTP 抓取
├── cache.js        # 通过 better-sqlite3 操作 SQLite
├── config.js       # YAML 配置加载
├── multi-day.js    # 趋势分析
├── signal.js       # 交易信号生成
└── alert.js        # 告警引擎
```

## 目标 / 非目标

**目标:**
- 将所有 JavaScript 文件转换为 TypeScript，启用严格类型检查
- 使用 `tsx` 作为运行时（现代、快速、原生 ESM 支持）
- 遵循 2025-2026 TypeScript 社区最佳实践
- 保持现有功能完全一致（无行为变更）
- 使 `pnpm test` 能够处理 TypeScript 源文件

**非目标:**
- 改变架构或数据流
- 添加新功能
- 从 SQLite 迁移到其他数据库
- 改变 CLI 命令结构
- 同时支持 JS 和 TS（纯迁移）

## 关键设计决策

### 1. tsconfig.json 启用 strict 模式

**决策:** 使用 `strict: true` 及以下关键配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**理由:**
- `strict: true` 启用所有严格类型检查选项 —— 这是新 TypeScript 项目的行业标准
- `NodeNext` 模块解析是现代 Node.js 标准
- `skipLibCheck: true` 通过跳过声明文件的类型检查来加快编译

**备选方案:**
- `moduleResolution: "node"` —— 旧版，不支持 `package.json` 的 `exports` 字段
- `strict: false` —— 违背迁移初衷
- `noUncheckedIndexedAccess` —— 对初始迁移过于严格，可后续添加

### 2. 使用 tsx 作为运行时而非 ts-node

**决策:** 将 `node src/cli.js` 替换为 `tsx src/cli.ts`

**理由:**
- tsx 比 ts-node 快 10-100 倍（使用 esbuild）
- 原生 ESM 支持
- 无需编译步骤
- 与 `type: "module"` 的 package.json 配合良好

**备选方案:**
- `ts-node` —— 旧版、慢速，不推荐新项目使用
- 编译为 JS 后运行 —— 增加构建步骤复杂度
- `vitest` + 转换器 —— 对此项目规模过于复杂

### 3. 依赖项的类型定义

**决策:** 在有 @types 包可用时安装：

```bash
npm install --save-dev @types/better-sqlite3 @types/commander @types/js-yaml
```

**理由:**
- 这些库在 DefinitelyTyped 有高质量的类型定义
- 避免为类型良好的库编写手動类型声明

**内部类型（不在 @types 中）:**
创建 `src/types/index.ts`，包含以下接口：
- `HoldingRecord`、`Participant`、`StockInfo`
- `SignalResult`、`Alert`、`Watchlist`
- `Config`、`SignalWeights`、`SignalThresholds`

### 4. ESLint 配置

**决策:** 使用扁平配置配合 `@typescript-eslint/eslint-plugin`：

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettier.rules,
    },
  },
];
```

**理由:**
- 扁平配置是 2025 年 ESLint 标准
- `eslint-config-prettier` 禁用冲突规则
- `@typescript-eslint/recommended` 提供合理默认值

### 5. package.json 变更

**决策:** 更新 scripts 使用 tsx：

```json
{
  "type": "module",
  "scripts": {
    "start": "tsx src/cli.ts",
    "test": "tsx --test src/"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/commander": "^2.20.0",
    "@types/js-yaml": "^4.0.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "eslint-config-prettier": "^9.0.0",
    "@eslint/js": "^9.0.0"
  }
}
```

**理由:**
- `type: "module"` 启用 ESM（tsx 使用现代特性时需要）
- 直接使用 `tsx` 无需编译步骤

## 风险 / 权衡

**[风险] JS 和 TS 之间的运行时行为差异**
→ **缓解措施:** tsx 在运行时将 TypeScript 编译为 JavaScript，语义完全相同。预期无行为变更。

**[风险] strict 模式可能标记转换代码中的问题**
→ **缓解措施:** 初始使用 `strict: true`，但在类型复杂的转换代码中可酌情使用 `// @ts-ignore`，后续再修复。

**[风险] 破坏 CLI 接口的兼容性**
→ **缓解措施:** package.json 中的 `bin` 字段通过 tsx 指向 `src/cli.ts`，保持 `ccass` 命令不变。

**[风险] 循环依赖带来的迁移复杂性**
→ **缓解措施:** 在迁移前检查当前 JS 代码中的循环 require。TypeScript 可能需要显式类型注解来解决。

## 迁移计划

### 第一阶段：项目初始化
1. 将 TypeScript 和开发依赖添加到 package.json
2. 创建带有 strict 模式的 `tsconfig.json`
3. 创建带有 TypeScript 支持的 `eslint.config.js`
4. 验证 `tsx --version` 正常工作

### 第二阶段：类型定义
1. 创建包含所有内部接口的 `src/types/index.ts`
2. 更新 `.gitignore`（排除 `dist/` 如果后续添加编译）

### 第三阶段：逐文件转换
按依赖顺序转换（叶子模块优先）：
1. `config.ts` —— 无依赖
2. `cache.ts` —— 使用 better-sqlite3 类型
3. `fetcher.ts` —— 使用 cache 类型
4. `multi-day.ts` —— 使用 cache 类型
5. `signal.ts` —— 使用 cache、config、fetcher 类型
6. `alert.ts` —— 使用 signal、config 类型
7. `cli.ts` —— 使用所有其他模块

### 第四阶段：验证
1. 运行 `pnpm start -- signal 03690` 验证 CLI 正常工作
2. 运行 `pnpm test` 验证测试通过
3. 运行 `pnpm lint`（如果添加了 lint 脚本）检查类型

## 待解决问题

1. **是否保留 `dist/` 编译**还是用 tsx 直接从 `src/` 运行？ —— 决策：使用 tsx 直接运行（无 dist），简化部署。

2. **是否添加 `noUncheckedIndexedAccess`** 作为额外严格性？ —— 决策：初始迁移不添加，如有需要后续再添加。

3. **路径别名**（`@/*` → `src/*`）？ —— 决策：此项目规模不需要，会增加复杂度。
