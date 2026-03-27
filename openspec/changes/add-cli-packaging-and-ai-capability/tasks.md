## 1. TypeScript Build Setup

- [x] 1.1 Verify `tsconfig.json` has proper `outDir` and `declaration` settings
- [x] 1.2 Add `build` script to `package.json` (`tsc`)
- [x] 1.3 Add `prepublishOnly` script to build before publish
- [x] 1.4 Configure `files` in package.json to include `dist/` for published JS

## 2. GitHub Actions Release Workflow

- [x] 2.1 Create `.github/workflows/release.yml` with release-drafter template
- [x] 2.2 Add TypeScript build step (`pnpm run build`)
- [x] 2.3 Configure npm publish action (publishes from `dist/`)
- [x] 2.4 Add GitHub Release asset upload step (tarball/zip)
- [x] 2.5 Add workflow dispatch for manual releases
- [ ] 2.6 Test workflow syntax with act or PR

## 3. package.json CLI Configuration

- [x] 3.1 Update `bin` field to point to compiled `dist/cli.js` (or keep `tsx src/cli.ts` for development)
- [x] 3.2 Ensure `engines` field specifies `node >= 18`
- [x] 3.3 Verify `files` includes necessary files and `dist/`

## 4. SKILL.md Creation

- [x] 4.1 Create `SKILL.md` with tool description
- [x] 4.2 Define all CLI commands in structured format
- [x] 4.3 Add command examples with expected outputs
- [x] 4.4 Document JSON output format per command
- [x] 4.5 Add constraints and best practices for AI usage

## 5. CLI JSON Output Support

- [x] 5.1 Add `--json` flag to fetch command
- [x] 5.2 Add `--json` flag to compare command
- [x] 5.3 Add `--json` flag to signal command
- [x] 5.4 Add `--json` flag to alert command
- [x] 5.5 Ensure all error responses are JSON formatted

## 6. README Agent Section

- [x] 6.1 Create "AI Agent 使用" section
- [x] 6.2 Add MCP integration instructions
- [x] 6.3 Document agent workflow examples
- [x] 6.4 Add output format reference
- [x] 6.5 Update quick start to show both human and AI usage
