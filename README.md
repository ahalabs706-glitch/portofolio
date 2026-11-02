# DevFolio

DevFolio is a portfolio and CV generator. This repository is being built as a
TypeScript npm-workspaces monorepo with a React/Vite web application, an Express
API, and PostgreSQL.

## Current status

The repository includes a React/Vite frontend, an Express API, shared
validation schemas, and PostgreSQL persistence. Users can register and sign
in, then create and edit CVs that are stored on the server and scoped to their
account. The editor previews three templates and supports print-to-PDF export.

## Prerequisites

- Node.js 24 LTS and npm 11
- Docker Engine with the Docker Compose plugin (optional for native development)

## Run with Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Apply the initial database migration, then open <http://localhost:5173>:

```powershell
docker compose exec api npm run db:deploy
```

Register an account to create and manage CVs. **Export PDF** opens the
browser's print dialog; select **Save as PDF**. API liveness is available at
<http://localhost:4000/api/v1/health>; readiness at
<http://localhost:4000/api/v1/ready> checks database connectivity.

PostgreSQL is bound to `127.0.0.1:5432` for local development only and uses a
persistent named volume. Do not reuse the example credentials outside a local
development environment. To stop the services without deleting database data:

```powershell
docker compose down
```

CV content is persisted in PostgreSQL. Session credentials are held in an
HttpOnly cookie; write requests use a CSRF token. Use non-example database
credentials outside local development and configure `WEB_ORIGIN` to the exact
trusted frontend origin.

To intentionally remove the local database volume, run
`docker compose down --volumes` only after confirming that its data is
disposable.

## Run natively

Start a local PostgreSQL instance and set `DATABASE_URL` to a connection string
reachable from the host. Copy `.env.example` to `.env`, update its values, and
apply migrations before starting the services:

```powershell
npm ci
npm run db:deploy --workspace @devfolio/api
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:4000` by
default. Set `API_PROXY_TARGET` if the API runs elsewhere. The API listens on
port 4000 by default; set `PORT` to override it.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

## Repository layout

- `apps/web`: React, Vite, Tailwind CSS frontend
- `packages/shared`: shared CV and authentication schemas/types
- `apps/api`: Express API, Prisma/PostgreSQL persistence, authentication, and CV routes
- `apps/web/src/features/cv`: editor, templates, dashboard, and portfolio preview
- `docs/architecture.md`: architecture, ownership, and session design
- `docs/local-development.md`: native and Compose workflows

See [architecture](docs/architecture.md) and
[local development](docs/local-development.md) for foundation decisions and
limitations. Production deployment files will be added in later phases.
