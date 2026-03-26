## ADDED Requirements

### Requirement: Skill file format

The system SHALL provide a `/ccass` AI skill compatible with Claude Code's skill system, implemented as `skill.md` in the project root.

#### Scenario: Skill invocation
- **WHEN** user types `/ccass <command>` in Claude Code
- **THEN** Claude Code SHALL invoke the skill with the provided arguments
- **AND** skill SHALL delegate to appropriate CLI subcommand

### Requirement: Skill frontmatter

The skill.md SHALL contain frontmatter with:

```
---
name: ccass
description: 查询港交所 CCASS 机构持仓数据，生成交易信号
arguments: <stockCode> [command] [options]
---
```

### Requirement: Natural language to CLI mapping

The skill SHALL support natural language commands mapped to CLI subcommands:

| Natural language | CLI subcommand |
|---|---|
| "查询汇丰在美团的持仓" | `fetch 03690` |
| "对比美团最近7天" | `compare 03690 --window 7` |
| "生成美团的交易信号" | `signal 03690` |
| "检查我的监控列表" | `alert` |

#### Scenario: Natural language fetch
- **WHEN** user says "查询 03690 汇丰 2024/03/06"
- **THEN** skill SHALL call `fetch 03690 --date 2024/03/06`
- **AND** return formatted holding data

#### Scenario: Natural language compare
- **WHEN** user says "对比 03690 最近30天"
- **THEN** skill SHALL call `compare 03690 --window 30`
- **AND** return trend analysis

### Requirement: Stock code resolution

The skill SHALL support stock name resolution (Chinese or English) to stock code:

#### Scenario: Stock name to code
- **WHEN** user says "查询汇丰在美团的持仓"
- **THEN** skill SHALL resolve "美团" to "03690"
- **AND** execute `fetch 03690`

### Requirement: Parameter extraction

The skill SHALL extract parameters from natural language:

- Stock code: 5-digit number
- Date: YYYY/MM/DD format
- Days: integer (e.g., "7天", "30天")
- Confidence threshold: decimal 0-1

#### Scenario: Extract date parameter
- **WHEN** user says "查询 03690 在 2024/03/06 的数据"
- **THEN** skill SHALL extract `date: "2024/03/06"`
- **AND** pass to CLI

### Requirement: Output formatting

The skill SHALL receive CLI JSON output and format it as readable natural language for display to user.

#### Scenario: Format signal output
- **WHEN** CLI returns signal JSON
- **THEN** skill SHALL format as: "📈 信号：强烈买入 | 置信度：82% | 汇丰连续5日增持美团"
