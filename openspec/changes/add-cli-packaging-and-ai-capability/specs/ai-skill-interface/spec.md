## ADDED Requirements

### Requirement: SKILL.md File
The project SHALL contain a `SKILL.md` file in the root directory that defines the tool interface for AI Agents.

### Requirement: Command Interface Description
The SKILL.md SHALL define all CLI commands in a structured format that AI Agents can parse and invoke.

### Requirement: Structured Output Format
CLI commands SHALL output JSON when `--json` flag is passed, enabling AI Agent parsing.

### Requirement: Error Code Convention
CLI SHALL exit with code 0 for success, non-zero for errors, with descriptive error messages.

---

#### Scenario: AI Agent invokes fetch command
- **WHEN** AI Agent reads SKILL.md and executes `ccass-monitor fetch 03690 --date 2024/03/06 --json`
- **THEN** command outputs valid JSON with stock holdings data
- **AND** exit code is 0

#### Scenario: AI Agent invokes signal command
- **WHEN** AI Agent executes `ccass-monitor signal 03690 --json`
- **THEN** output includes `signal` field with BUY/SELL/STRONG_BUY/STRONG_SELL/HOLD
- **AND** output includes `confidence` field (0.0-1.0)
- **AND** exit code is 0

#### Scenario: Invalid command handling
- **WHEN** AI Agent executes `ccass-monitor invalid-stock --json`
- **THEN** output contains `error` field with descriptive message
- **AND** exit code is non-zero

#### Scenario: SKILL.md provides tool description
- **WHEN** AI Agent reads `SKILL.md`
- **THEN** it can determine the tool's capabilities
- **AND** available commands with parameters
- **AND** expected output formats
