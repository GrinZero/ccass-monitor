## ADDED Requirements

### Requirement: GitHub Actions Release Workflow
The system SHALL provide a GitHub Actions workflow that automatically builds and publishes the package when a new release is created.

### Requirement: npm Package Distribution
The package SHALL be publishable to npm registry with proper bin entry point.

### Requirement: GitHub Release Assets
The release workflow SHALL generate tarball and zip assets for manual download.

---

#### Scenario: Release on version tag
- **WHEN** maintainer pushes a tag matching `v[0-9]+.[0-9]+.[0-9]+`
- **THEN** GitHub Actions triggers release workflow
- **AND** builds the package with pnpm
- **AND** publishes to npm registry
- **AND** creates GitHub Release with tarball/zip assets

#### Scenario: Manual release trigger
- **WHEN** maintainer triggers workflow manually from Actions tab
- **THEN** workflow builds and publishes using provided version
- **AND** creates GitHub Release with assets

#### Scenario: npm install after publish
- **WHEN** user runs `npm install -g ccass-monitor`
- **THEN** CLI is available globally as `ccass-monitor` command
- **AND** user can run `ccass-monitor --help`
