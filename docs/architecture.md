# Architecture

## Application architecture

DevFolio is a modular monolith in an npm-workspaces repository:

- `apps/web` is a React and Vite single-page application. Vite proxies `/api`
  requests to the API in local development so the browser uses a same-origin
  path.
- `apps/api` is an Express application. It owns HTTP concerns, authentication,
  authorization, persistence, health checks, and structured logging.
- `packages/shared` contains Zod validation schemas and TypeScript contracts
  consumed by both frontend and API.
- PostgreSQL runs as a separate Compose service and is only exposed on the
  developer's loopback interface.

The web/API boundary is HTTP JSON under `/api/v1`. The web app must not connect
directly to PostgreSQL. The API validates request data with shared schemas and
scopes all CV access by the authenticated user. CV content is stored as
validated JSONB while identity, ownership, and lifecycle fields remain
relational.

## Data-model direction

The Prisma schema contains relational `User`, `Cv`, and `Session` records.
Ownership is enforced by a foreign key and every CV query is scoped to its
owner. CV section content lives in a validated JSONB document on the CV record:

- This keeps editor updates and template rendering straightforward as optional
  sections evolve.
- It trades away database-level constraints and easy cross-CV reporting for
  those nested fields.
- Fields needed for querying, uniqueness, authorization, and lifecycle
  management should remain relational.

Schema changes are tracked in PostgreSQL Prisma migrations. Apply committed
migrations with `npm run db:deploy --workspace @devfolio/api`; use
`npm run db:migrate --workspace @devfolio/api` while developing schema changes.

## Operational boundaries

- `/api/v1/health` is a liveness check and does not query PostgreSQL.
- `/api/v1/ready` tests database connectivity and reports a generic `503` when
  the dependency is unavailable. The error is logged server-side, not returned.
- Request logs omit headers and body fields by default; common credential-like
  keys are redacted.
- Docker Compose health dependencies gate API startup on PostgreSQL readiness
  and web startup on API readiness.
- The Compose configuration and Dockerfiles are for development only.
  Production images, TLS/reverse proxy, and deployment automation remain future
  work.

## Security assumptions and risks

- `.env.example` contains local-only values. Copy it to an ignored `.env` and
  replace values for any shared or deployed environment.
- PostgreSQL is not exposed beyond host loopback in the development Compose
  file. Production networking must not publish the database port.
- Passwords are hashed with Argon2id. Opaque random session tokens are stored
  only as SHA-256 hashes in the database and delivered via HttpOnly,
  SameSite=Lax cookies. Cookie sessions expire after seven days.
- State-changing requests require the session's CSRF token and trusted origin.
  Configure `WEB_ORIGIN` to the exact frontend origin; deploy behind HTTPS so
  production cookies are Secure.
- CV data is account-scoped, but the development deployment is not hardened
  for production. Use strong database credentials, TLS, backups, and
  operational monitoring before handling real user data.
- The development containers run as the base Node image user and mount the
  source tree. Separate hardened non-root runtime images belong to the
  production-container phase.
