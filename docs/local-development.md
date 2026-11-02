# Local development

## Compose workflow

Install Docker Engine and its Compose plugin, then from the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

- Web: <http://localhost:5173>
- API liveness: <http://localhost:4000/api/v1/health>
- API readiness: <http://localhost:4000/api/v1/ready>
- PostgreSQL: `127.0.0.1:5432` (local development only)

Compose waits for PostgreSQL's health check before starting the API, and waits
for API readiness before starting the web service. Apply the schema migration
once after bringing the stack up:

```powershell
docker compose exec api npm run db:deploy
```

Source files are mounted into the web and API development containers.
`postgres_data` persists database files across container recreation. CVs are
stored in PostgreSQL and are available after signing back in. The Export PDF
action uses the browser print dialog; choose its “Save as PDF” destination.

Useful commands:

```powershell
docker compose ps
docker compose logs -f web api postgres
docker compose restart api
docker compose down
```

`docker compose down` preserves the database volume. Removing local data is
destructive: only use `docker compose down --volumes` when that data is
disposable. Do not use that command against a production deployment.

## Native Node workflow

Install Node.js 24 LTS and npm 11. Start PostgreSQL separately, then configure a
host-reachable `DATABASE_URL` in the shell. For example:

```powershell
$env:DATABASE_URL = "postgresql://devfolio:local-development-only@localhost:5432/devfolio"
npm ci
npm run dev
```

The web server proxies `/api` to `http://localhost:4000`. Override this with
`API_PROXY_TARGET` if needed. The API requires `DATABASE_URL` and `WEB_ORIGIN` and accepts a `PORT` override.
Apply committed migrations before using the app:

```powershell
npm run db:deploy --workspace @devfolio/api
```

## Verification commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
docker compose config
```

The API route tests mock Prisma and do not require a live database. Readiness
does; run it against the Compose or native PostgreSQL service to verify
connectivity.

## Troubleshooting

- **Compose rejects missing variables:** copy `.env.example` to `.env` at the
  repository root.
- **Port already in use:** stop the local service using `5432`, `4000`, or
  `5173`, or adjust the host-side port mapping in `docker-compose.yml`.
- **API stays unhealthy:** check `docker compose logs api postgres`; verify the
  `DATABASE_URL` host is `postgres` in Compose and that the database credentials
  match the `POSTGRES_*` variables.
- **Web cannot reach the API:** in Compose, the Vite proxy target must use the
  service DNS name `http://api:4000`. For native development, use
  `http://localhost:4000`.
