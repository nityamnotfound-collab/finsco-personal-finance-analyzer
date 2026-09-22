# FinAI

FinAI is a local-first personal finance analyzer that turns transactions, CSV imports, and manual portfolio snapshots into explainable charts, insights, and AI/ML analysis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finai/src/App.tsx` — FinAI shell, live calculations, local persistence, CSV parsing, charts, and reports
- `artifacts/finai/src/index.css` — FinAI visual system and responsive layout
- `ml/finai_ml.py` — runnable Scikit-learn reference implementation
- `README.md` — demo, architecture, and academic explanation

## Architecture decisions

- The demo is local-first so a student can present it without bank credentials, API keys, or an unreliable third-party feed.
- The browser mirrors the academic ML concepts for instant feedback; `ml/finai_ml.py` provides the requested Scikit-learn implementation.
- Portfolio prices are manually entered snapshots and are never presented as live market data.
- Demo data is opt-in from the welcome state and persists after it is loaded.

## Product

- Dashboard with live income, expense, savings, category, and portfolio metrics
- Manual transaction CRUD and validated CSV upload with preview
- Expense filters, searchable ledger, charts, anomaly flags, classifier playground, portfolio P&L, insights, and downloads
- Local browser persistence; demo mode seeds fictional multi-month data without requiring credentials

## User preferences

- The user needs a polished, demo-ready BCA AI/ML project with functionality prioritized over unnecessary complexity.

## Gotchas

- `pnpm --filter @workspace/finai run typecheck` is the reliable app check; Vite builds need workflow-provided `PORT` and `BASE_PATH` or explicit shell values.
- No live stock feed is used; current prices are clearly labeled manual snapshots.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
