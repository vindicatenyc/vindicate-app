# Vindicate NYC

[![CI](https://github.com/vindicatenyc/vindicate-app/actions/workflows/ci.yml/badge.svg)](https://github.com/vindicatenyc/vindicate-app/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Open-source financial recovery and legal case management for individuals navigating debt disputes, tax recovery, and arbitration.**

> **DISCLAIMER**: This software provides educational tools and templates. It is NOT legal advice. Always consult with a licensed attorney before taking legal action.

## Mission

Help individuals in financial hardship understand their rights and navigate complex legal processes with transparent, auditable tools.

## Features

### Phase 1 (Current)
- [ ] **IRS Form 433-A Calculator** - Calculate disposable income and Offer in Compromise amounts using official IRS methodology
- [ ] **Credit Report Parser** - Extract and classify accounts from credit reports (Equifax, Experian, TransUnion)
- [ ] **Dispute Letter Generator** - Generate FCRA-compliant dispute letters
- [ ] **Case Timeline Tracker** - Track deadlines, responses, and case status

### Roadmap
- **Phase 2**: Arbitration document generation, call recording/transcription
- **Phase 3**: AI-powered case analysis, multi-state support

## Quick Start

```bash
# Clone the repository
git clone https://github.com/vindicatenyc/vindicate-app.git
cd vindicate-app

# Install dependencies
pnpm install

# Set up Python environment
cd packages/core
pip install -e ".[dev,test]"
cd ../..

# Run development servers
pnpm dev
```

## Packages

| Package | Description |
|---------|-------------|
| `@vindicate/core` | Python - Financial calculations, document parsing |
| `@vindicate/api` | REST API server |
| `@vindicate/cli` | Command-line interface |
| `@vindicate/web` | Next.js web application |
| `@vindicate/shared` | Shared types and utilities |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web UI (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│              REST API (Hono)          Core (Python)         │
├─────────────────────────────────────────────────────────────┤
│              PostgreSQL (Event Sourced)                     │
└─────────────────────────────────────────────────────────────┘
```

## Security

- All sensitive data (TIER 1) encrypted at rest (AES-256)
- Full audit logging for compliance
- No data sold or shared with third parties
- See [SECURITY.md](./SECURITY.md) for vulnerability reporting

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Agent Workflow
This project uses Claude AI agents for development. See `.claude/AGENTS.md` for the coordination protocol.

## License

This project is licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).

## Links

- **Website**: https://vindicate.nyc
- **GitHub**: https://github.com/vindicatenyc/vindicate-app
