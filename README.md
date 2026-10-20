# Perkly

Local shell for Perkly. The web app, API, and worker run on your machine without AWS.

Perkly does not charge a merchant sale. The business charges the customer on its own till. There is no checkout and no merchant payment in this repository. Membership billing is a later task.

The API does not open a database connection yet. PostgreSQL is started separately.

## Requirements

- Node.js 24.22.0 or a newer Node 24 release. The checked file is `.nvmrc`.
- npm 11.19.1, the copy that ships with Node.js 24.22.0.
- Docker, for the local PostgreSQL Compose file.

## Local setup

```bash
nvm use
npm ci
docker compose -f infra/docker-compose.yml up -d --wait
npm run db:migrate
npm run db:seed:local
npm run dev
```

Open http://127.0.0.1:5173.

The first screen is English, Hebrew, and Arabic. Hebrew and Arabic lay out right to left. The language buttons are English, עברית, and العربية. The choice is a display preference in this browser. It is not an account, a membership, or a role.

The web server proxies `/api` to the API on http://127.0.0.1:3001. `GET /api/v1` answers with the service name and `database: "not_connected"`.

These commands also start the processes:

```bash
npm run start:api
npm run start:worker
```

`start:worker` stays running. It does not process jobs. There is no queue in this build.

`PORT` changes the API port (default `3001`). `HOST` changes the API bind address (default `127.0.0.1`).

## Checks

```bash
npm run check
npm run build
npm run test:smoke:database
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run check:container
```

`npm run check` runs the typecheck, lint, format check, and unit tests. `test:smoke:database` migrates the disposable database on real PostgreSQL. `test:e2e` opens the home screen in Chromium, checks English, then Hebrew right to left. `check:container` builds `infra/Dockerfile` and runs it as the image's `node` user.

GitHub Actions in `.github/workflows/ci.yml` runs the same checks.

## Database

Compose uses the `postgres:17` image. That major is a proposal. The RDS major is not chosen yet.

```bash
docker compose -f infra/docker-compose.yml up -d --wait
npm run db:migrate
```

`db:migrate` applies numbered migrations to the local dev database `perkly` on 127.0.0.1:5432. The disposable test database is `perkly_test`.

```bash
npm run db:reset:test
DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly_test npm run db:migrate
npm run test:integration
```

`db:reset:test` drops and recreates only `perkly_test`. `test:integration` does the same, then migrates it. Both refuse a hosted host, `APP_MODE=staging` or `production`, and any database name other than `perkly_test`.

`db:seed:local` accepts only the loopback dev database. It writes fictional profiles, search fixtures, and one outbox row, and it does not send mail. A second run does not duplicate those rows.

Local passwords are in `infra/docker-compose.yml` and `packages/database/src/local.ts`. They are not for a hosted database.

The migration role owns the schema. The runtime role can read the foundation marker and cannot change schema. The API and worker do not use either role yet.

## Layout

| Path                     | What it is in this build                                            |
| ------------------------ | ------------------------------------------------------------------- |
| `apps/web/`              | Vue 3, TypeScript, and Vite. One home screen and the locale files.  |
| `apps/api/`              | Express API. One route, `GET /api/v1`.                              |
| `apps/worker/`           | Worker process. It starts and waits.                                |
| `packages/domain/`       | Place for pricing and permission rules. No rules yet.               |
| `packages/contracts/`    | Shared locale and service-descriptor types.                         |
| `packages/database/`     | Migration runner, transaction helper, and local role split.         |
| `packages/integrations/` | Adapter selection. No payment client.                               |
| `packages/search/`       | Local search fixtures. No model client.                             |
| `infra/`                 | Local PostgreSQL Compose and the non-root API image. No CDK stack.  |
| `scripts/`               | Local dev, test guards, and the container run check.                |
| `tests/`                 | Unit tests, a native Postgres smoke test, and a browser smoke test. |
| `docs/`                  | Product rules, decisions, and task tracking.                        |

Shell wording in Hebrew and Arabic has not had native-speaker review.

## Next task

P01-05. Add redacted logs, request IDs, the error schema, health and shutdown, and the append-only audit grants. Do not add checkout or a merchant payment.
