## ADDED Requirements

### Requirement: AI Agent Usage Section
The README SHALL contain a dedicated section for AI Agent usage with practical examples.

### Requirement: MCP Integration Documentation
The README SHALL document how to integrate with Model Context Protocol (MCP) servers.

### Requirement: Agent Workflow Examples
The README SHALL provide step-by-step examples of AI Agent workflows using the tool.

### Requirement: Output Format Documentation
The README SHALL document the JSON output format for each command for AI parsing.

---

#### Scenario: AI Agent reads README for tool capabilities
- **WHEN** AI Agent reads README
- **THEN** it finds a clear "AI Agent 使用" section
- **AND** can understand tool capabilities without human documentation

#### Scenario: AI Agent follows MCP integration steps
- **WHEN** AI Agent follows MCP integration steps in README
- **THEN** it can configure the tool as an MCP server or tool
- **AND** can invoke commands through the MCP interface

#### Scenario: AI Agent parses JSON output
- **WHEN** AI Agent executes command with `--json` flag
- **THEN** it can parse the output using standard JSON parsing
- **AND** extract structured data for further processing
