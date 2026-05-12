# Medical AI Assistant

Medical AI Assistant is a healthcare inventory and procurement operations platform. It pairs a Go REST API with a Next.js dashboard so clinical supply, pharmacy, and materials teams can monitor stock posture, orchestrate purchase orders, and review analytics from a single workspace.

The codebase is structured for production rollout: PostgreSQL schemas and Redis-ready caching hooks ship alongside the default runtime, which keeps development friction low by running entirely on in-process storage.

## Architecture

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix primitives, Recharts, Sonner toasts, `next-themes` for dark/light mode.
- **Backend**: Go 1.22, Gin, JWT authentication, layered handlers/services/repositories, configurable CORS, structured REST endpoints under `/api/v1`.
- **Domain layer**: Repository interfaces with an in-memory implementation for local execution; PostgreSQL-ready SQL artifacts live under `database/` for managed deployments.
- **Caching**: Cache abstraction with an in-memory implementation and optional Redis client wiring (`REDIS_ADDR`) when you enable remote infrastructure.
- **Delivery**: Dockerfiles for both tiers plus Compose orchestration with optional Postgres and Redis profiles.

```
Browser ──► Next.js (3000) ──► Go API (8080) ──► Repository interfaces
                                              ├── MemoryStore (default)
                                              ├── PostgreSQL adapters (optional wiring)
                                              └── Redis cache (optional wiring)
```

## Features

- Secure signup/login/logout with JWT bearer tokens, persisted sessions, and role-aware UI (`admin`, `manager`, `viewer`).
- Inventory catalog with SKU governance, category taxonomy, stock thresholds, expiry tracking, low-stock badges, and filtered search.
- Procurement workspace with supplier registry, multi-status purchase orders, and guided transitions across the fulfillment lifecycle.
- Dashboard analytics covering inventory valuation, procurement cadence, category concentration, and projected revenue coverage metrics.
- Smart insights engine highlighting reorder recommendations, stock-out horizon estimates, and historical movement trends derived from recorded inventory adjustments.
- Responsive SaaS shell with sidebar navigation, premium cards, loading states, toast notifications, and accessible dialogs.

## Repository layout

```
├── backend/                  # Go API (cmd, handlers, services, repositories, middleware)
├── frontend/                 # Next.js 15 client application
├── database/
│   ├── schema/               # Authoritative PostgreSQL DDL
│   └── migrations/           # Incremental migration scripts
├── infrastructure/
│   ├── docker/               # Compose overlays (optional extensions)
│   └── nginx/                # Reverse-proxy reference configuration
├── docker-compose.yml        # Local multi-container orchestration
└── README.md
```

## Prerequisites

- Node.js 20+ and npm (for the dashboard).
- Go 1.22+ (for native API execution).
- Docker Desktop or Docker Engine (optional, for container workflows).

## Environment variables

Copy `.env.example` to `.env` at the repository root (or export variables in your shell).

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Signing key for JWT issuance (use a long random string in production). |
| `PORT` | HTTP listen port for the Go API (`8080` default). |
| `ENV` | `development` or `production` (controls Gin mode). |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API. |
| `NEXT_PUBLIC_API_URL` | Absolute origin for browser-side fetch calls (`http://localhost:8080` locally). |
| `REDIS_ADDR` | Optional `host:port` to activate Redis-backed caching. |
| `DATABASE_URL` | Optional Postgres DSN when wiring SQL repositories. |

## Local development

### API

```bash
cd backend
go mod tidy
go run ./cmd/server
```

The service listens on `http://localhost:8080` and exposes `GET /health`.

### Web

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

The dashboard calls **`/api/v1` on the same Next.js origin**. By default the API is implemented **in-process with an in-memory store** (see `frontend/app/api/v1` and `frontend/lib/server`), so **no separate backend process is required** for local use. Optional: set `NEXT_PUBLIC_API_URL` to point the browser at an external Go API when you run `backend/cmd/server` instead.

Run UI only:

```bash
cd frontend
npm install
npm run dev
```

Run Next.js plus the external Go API together (optional):

```bash
cd frontend
npm install
npm run dev:stack
```

### Quality checks

```bash
cd backend && go test ./...
cd frontend && npm run lint && npm run test && npm run build
```

## Docker workflow

Build and launch both services:

```bash
docker compose up --build
```

- Dashboard: `http://localhost:3000`
- API: `http://localhost:8080`

Optional infrastructure (PostgreSQL + Redis) without impacting the default API process:

```bash
docker compose --profile datastore up --build
```

The API continues to run without those containers until you wire repository constructors to external databases.

### Reverse proxy

`infrastructure/nginx/default.conf` demonstrates routing browser traffic through Nginx while preserving WebSocket upgrades for Next.js dev tooling if you terminate TLS at the edge.

## API overview

Base URL: `/api/v1`

| Area | Methods | Notes |
| --- | --- | --- |
| `/auth/register` | `POST` | Creates accounts (`viewer`/`manager` roles). |
| `/auth/login` | `POST` | Returns JWT + user profile. |
| `/auth/me` | `GET` | Requires `Authorization: Bearer`. |
| `/auth/logout` | `POST` | Client-side token purge hook. |
| `/dashboard/summary` | `GET` | Aggregate KPI payload for charts. |
| `/insights` | `GET` | Smart recommendations & trends. |
| `/products` | `GET`, `POST`, `PUT`, `DELETE` | Inventory CRUD + filters (`q`, `categoryId`, `lowStock`, `expiring`). |
| `/categories` | `GET`, `POST`, `PUT`, `DELETE` | Reference data maintenance. |
| `/suppliers` | `GET`, `POST`, `PUT`, `DELETE` | Vendor registry. |
| `/purchase-orders` | `GET`, `POST`, `PUT`, `DELETE` | Procurement lifecycle management. |

Mutating inventory and procurement routes require `admin` or `manager` roles.

### Demo credentials

A seeded administrator is created on API startup:

- Email: `admin@swasthya-ai.in`
- Password: `SwasthyaIndia2026!`

Rotate these credentials before any shared deployment.

## Deployment guide

1. Build container images using the provided Dockerfiles or integrate with your CI pipeline.
2. Supply strong `JWT_SECRET`, configure HTTPS termination, and restrict `CORS_ORIGINS` to trusted domains.
3. Point `DATABASE_URL` at a managed PostgreSQL cluster and hydrate schema via `database/migrations`.
4. Optionally enable Redis for shared caching across API replicas by setting `REDIS_ADDR`.
5. Front the stack with your preferred ingress controller; reuse `infrastructure/nginx/default.conf` as a baseline.

## Screenshots

Capture production-grade visuals once your workspace is branded:

1. **Executive overview** — `/dashboard` KPI grid with procurement trend chart.
2. **Inventory command center** — `/inventory` filtered catalog table with dialog-driven edits.
3. **Procurement pipeline** — `/procurement` purchase order board highlighting lifecycle controls.

Store PNG exports under `docs/screenshots/` for handbook or investor collateral.

## License

This reference implementation is provided as-is for evaluation and portfolio use. Ensure compliance with HIPAA, GDPR, or other regulatory frameworks before handling real patient or procurement data.
