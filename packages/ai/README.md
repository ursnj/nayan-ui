# Nayan AI 🤖

A CLI tool that uses [Codex](https://github.com/openai/codex) or [Claude Code](https://code.claude.com) to review GitHub Pull Requests and scan repositories for security vulnerabilities with AI-powered agentic analysis and auto-fix capabilities.

## Features

### PR Review

- **🤖 Agentic Review**: Uses Codex CLI or Claude Code CLI's intelligent coding agents for deep code analysis
- **🐛 Bug Detection**: Finds logic errors, null pointer issues, race conditions, and edge cases
- **🔐 Security Analysis**: Detects SQL injection, XSS, hardcoded secrets, and auth issues
- **⚡ Performance Checks**: Identifies memory leaks, N+1 queries, and unnecessary computations
- **🛡️ Error Handling**: Catches missing try/catch, unhandled promises, and silent failures
- **✅ Test Coverage**: Checks if tests are added for new functionality
- **💬 Inline Comments**: Posts review comments directly on the relevant lines of code
- **📊 Summary Report**: Provides an overview of all issues found

### Vulnerability Scanning

- **🔍 Multi-Language Support**: Scans npm, Python, Go, Rust, Ruby, PHP, Java, and .NET projects
- **🤖 AI-Powered Analysis**: Uses Codex or Claude to detect vulnerabilities beyond native tools
- **📋 CVE Tracking**: Lists all CVE identifiers found in dependencies
- **🔧 Auto-Fix**: Generates fixes and creates PRs automatically with `--fix` flag
- **🎯 Context-Aware Severity**: Adjusts severity based on project type (bundled vs server-side)

### General

- **🖥️ Local Execution**: Run from your terminal, no GitHub Actions / Jenkins required
- **🏢 Enterprise Support**: Works with GitHub Enterprise Server (auto-detected)
- **🔒 Private Repos**: Full support for private repositories

## Installation

### Prerequisites

1. **Node.js 18+** - Required runtime
2. **Codex CLI** (default) - Login to Codex CLI first:
   ```bash
   npx @openai/codex login
   ```
3. **Claude Code CLI** (optional) - If using `--llm claude`:
   ```bash
   claude login
   ```

### Install nayan-ai

```bash
npm install -g @nayan-ui/ai
```

## Usage

### Review Command

Review a GitHub Pull Request for code issues:

```bash
nayan-ai review https://github.com/owner/repo/pull/123 --token ghp_xxx
```

#### Review Options

| Option         | Description                                      |
| -------------- | ------------------------------------------------ |
| `-t, --token`  | GitHub personal access token (required)          |
| `-l, --llm`    | LLM provider: `codex` (default) or `claude`      |
| `-d, --dry`    | Analyze without posting comments to GitHub       |
| `-i, --inline` | Post inline comments on files instead of summary |

### Scan Command

Scan a GitHub repository for package vulnerabilities using native tools + AI analysis:

```bash
# Basic scan - detect and analyze all projects in the repo
nayan-ai scan https://github.com/owner/repo --token ghp_xxx

# Scan specific paths in the repo (detects all projects inside)
nayan-ai scan https://github.com/owner/repo --token ghp_xxx --paths packages/api,packages/web

# Auto-fix vulnerabilities and create a PR
nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix

# Auto-fix with custom branch name
nayan-ai scan https://github.com/owner/repo --token ghp_xxx --fix --branch nayan-ai/security-updates
```

#### Scan Options

| Option         | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `-t, --token`  | GitHub personal access token (required)                                 |
| `-l, --llm`    | LLM provider: `codex` (default) or `claude`                             |
| `-p, --paths`  | Comma-separated list of paths to scan for projects                      |
| `-f, --fix`    | Auto-fix vulnerabilities and create a PR                                |
| `-b, --branch` | Branch name for fix PR (default: `nayan-ai/security-fixes-<timestamp>`) |

#### Scan Output

The scan provides:

- **Per-project vulnerabilities** grouped by severity (Critical, High, Medium, Low)
- **CVE identifiers** for each vulnerability
- **Suggested fixes** with package version updates
- **Breaking changes warnings** when applicable

#### Auto-Fix Workflow

When using `--fix`, Nayan AI will:

1. Analyze vulnerabilities and generate fixes using AI
2. Create a new branch with the fixes
3. Update manifest files (package.json, requirements.txt, etc.)
4. Commit and push changes
5. Create a Pull Request with detailed description of all changes

#### Supported Project Types

| Type       | Manifest         | Lock Files                                   | Native Scanner             |
| ---------- | ---------------- | -------------------------------------------- | -------------------------- |
| **npm**    | package.json     | package-lock.json, yarn.lock, pnpm-lock.yaml | `npm audit`                |
| **Python** | requirements.txt | Pipfile.lock, poetry.lock                    | `pip-audit`                |
| **Go**     | go.mod           | go.sum                                       | `govulncheck`              |
| **Rust**   | Cargo.toml       | Cargo.lock                                   | `cargo audit`              |
| **Ruby**   | Gemfile          | Gemfile.lock                                 | `bundle audit`             |
| **PHP**    | composer.json    | composer.lock                                | `composer audit`           |
| **Java**   | pom.xml          | -                                            | `mvn dependency-check`     |
| **.NET**   | \*.csproj        | packages.lock.json                           | `dotnet list --vulnerable` |

#### Context-Aware Severity

The AI adjusts vulnerability severity based on project context:

- **Bundled/Static Projects** (React, Vue, Angular, SPAs):
  - DevDependencies → LOW (not in production bundle)
  - Build tools (webpack, babel, eslint) → LOW
  - Only runtime deps in client bundle → HIGH

- **Server-side Projects** (Node.js APIs, Express):
  - Runtime dependencies → HIGH
  - DevDependencies → LOW

- **Libraries** (npm/pypi packages):
  - Runtime deps → HIGH (affects consumers)
  - DevDependencies → LOW

## License

MIT
