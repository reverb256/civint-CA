# civint-CA

**Civilian intelligence infrastructure for Canada.**

An open, MIT-licensed data pipeline that ingests, curates, verifies, and serves Canadian civic data — news articles, government releases, spending data, and more — via REST API, MCP server, and CLI.

Built for journalists, developers, civic tech projects, and independent researchers who need trustworthy, machine-readable Canadian data.

## Architecture

```
civint-CA/
├── packages/
│   ├── pipeline-core/     # Core ingestion, curation, verification, audit
│   ├── mcp-server/        # MCP server for AI agent access
│   ├── cli/               # `civint` CLI tool
│   └── website/           # Docs & SaaS portal (GitHub Pages)
├── LICENSE                # MIT
└── README.md
```

## Pipeline

```
RSS feeds ──▶ pipeline-core ──▶ D1/Postgres ──▶ REST API
Gov APIs   │   ┌──────────┐                    ├── MCP server
CKAN       │   │ Curation │                    ├── CLI
StatCan    │   │ Citation │                    └── Dashboard (FG)
           │   │ Audit    │
           │   └──────────┘
           └── All MIT, all open
```

## Getting Started

```bash
git clone https://github.com/reverb256/civint-CA.git
cd civint-CA
npm install
npm run build
```

See `/packages/pipeline-core` for the core library, or `/packages/mcp-server` for the AI agent interface.

## License

MIT — free for any use, commercial or otherwise. Built for Canada.
