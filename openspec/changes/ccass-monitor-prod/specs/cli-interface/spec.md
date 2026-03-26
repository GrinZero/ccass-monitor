## ADDED Requirements

### Requirement: CLI subcommands

The CLI SHALL provide the following subcommands via `src/cli.js`:

- `fetch` — 拉取指定股票和日期的 CCASS 数据
- `compare` — 执行多日对比分析
- `signal` — 生成交易信号
- `alert` — 检查监控列表并告警

#### Scenario: CLI help output
- **WHEN** user runs `node src/cli.js --help`
- **THEN** it SHALL display usage with all subcommands
- **AND** each subcommand SHALL show its own help via `node src/cli.js <subcommand> --help`

### Requirement: `fetch` subcommand

**Usage**: `node src/cli.js fetch <stockCode> [options]`

Options:
- `--date <YYYY/MM/DD>` — 查询日期，默认上一交易日
- `--participant <id>` — 指定参与者 ID（默认从 `config.yaml` 的 `defaults.participant` 读取）
- `--all-participants` — 获取所有参与者数据，而非仅指定参与者
- `--output <file>` — 输出到文件而非 stdout

#### Scenario: Fetch single participant
- **WHEN** `node src/cli.js fetch 03690 --date 2024/03/06` is run
- **THEN** it SHALL output JSON to stdout with the holding data
- **AND** data SHALL be cached in SQLite

#### Scenario: Fetch all participants
- **WHEN** `node src/cli.js fetch 03690 --all-participants` is run
- **THEN** it SHALL return top 20 participants by shareholding
- **AND** each participant's rank SHALL be included

### Requirement: `compare` subcommand

**Usage**: `node src/cli.js compare <stockCode> [options]`

Options:
- `--window <days>` — 对比窗口天数，默认从 `config.yaml` 的 `defaults.windowDays` 读取（默认 7）
- `--participant <id>` — 参与者 ID（默认从 `config.yaml` 读取）
- `--output <file>` — 输出到文件

#### Scenario: 7-day compare
- **WHEN** `node src/cli.js compare 03690 --window 7` is run
- **THEN** it SHALL output structured JSON with 7-day analysis
- **AND** summary SHALL include SMA, momentum, trend, total change

### Requirement: `signal` subcommand

**Usage**: `node src/cli.js signal <stockCode> [options]`

Options:
- `--participant <id>` — 参与者 ID（默认从 `config.yaml` 读取）

#### Scenario: Generate signal
- **WHEN** `node src/cli.js signal 03690` is run
- **THEN** it SHALL output signal JSON with action, confidence, indicators
- **AND** it SHALL automatically use T-1 data
- **AND** weights SHALL be read from `config.yaml`

### Requirement: `alert` subcommand

**Usage**: `node src/cli.js alert [options]`

Options:
- `--watchlist <file>` — 监控列表文件，默认 `watchlist.json`
- `--min-confidence <score>` — 最低置信度阈值，默认从 `config.yaml` 读取

#### Scenario: Alert check
- **WHEN** `node src/cli.js alert --watchlist my-stocks.json` is run
- **THEN** it SHALL read watchlist from specified file
- **AND** it SHALL only check stocks/participants in the watchlist
- **AND** it SHALL output only signals meeting min-confidence threshold

### Requirement: JSON output format

All CLI subcommands SHALL output JSON to stdout by default.

#### Scenario: JSON structure
- **WHEN** any subcommand completes successfully
- **THEN** output SHALL be valid JSON to stdout
- **AND** errors SHALL be written to stderr with non-zero exit code

### Requirement: Error handling

- The CLI SHALL return exit code 0 on success
- The CLI SHALL return exit code 1 on error
- Error messages SHALL be descriptive and go to stderr
- Partial failures (some stocks succeed, some fail) SHALL output partial results with error flag

#### Scenario: Network error
- **WHEN** HKEX site is unreachable
- **THEN** CLI SHALL output `{"error": "Failed to fetch data", "detail": "..."}` to stderr
- **AND** exit code SHALL be 1
