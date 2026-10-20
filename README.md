# Perkly

Local shell for Perkly. The web app, API, and worker run on your machine without AWS.

Perkly does not charge a merchant sale. The business charges the customer on its own till. There is no checkout and no merchant payment in this repository. Membership billing is a later task.

The database is the next task (P01-02). Nothing here connects to PostgreSQL.

## Requirements

- Node.js 24.22.0 or a newer Node 24 release. The checked file is `.nvmrc`.
- npm 11.19.1, the copy that ships with Node.js 24.22.0.

## Local setup

```bash
nvm use
npm install
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
npm run typecheck
npm run check
npm run build
npm run test:unit
```

`npm run check` runs the typecheck, lint, format check, and unit tests.

## Database commands

```bash
npm run db:migrate
npm run db:seed:local
npm run test:integration
npm run test:e2e
```

These commands exit with an error. They do not connect, migrate, or seed. P01-02 adds PostgreSQL, the migration runner, a disposable test database, and transaction helpers. The PostgreSQL major version is not chosen yet. When seed exists, it must refuse any target that is not local and disposable.

## Layout

| Path                     | What it is in this build                                                    |
| ------------------------ | --------------------------------------------------------------------------- |
| `apps/web/`              | Vue 3, TypeScript, and Vite. One home screen and the locale files.          |
| `apps/api/`              | Express API. One route, `GET /api/v1`.                                      |
| `apps/worker/`           | Worker process. It starts and waits.                                        |
| `packages/domain/`       | Place for pricing and permission rules. No rules yet.                       |
| `packages/contracts/`    | Shared locale and service-descriptor types.                                 |
| `packages/database/`     | Place for PostgreSQL access. No connection yet.                             |
| `packages/integrations/` | Place for adapters. No provider client.                                     |
| `packages/search/`       | Place for search. No model client.                                          |
| `infra/`                 | Reserved for CDK. No stack.                                                 |
| `scripts/`               | Local dev, and the database commands that refuse to run.                    |
| `tests/`                 | Unit tests for locale direction. Integration and browser folders are empty. |
| `docs/`                  | Product rules, decisions, and task tracking copied from Phase 00.           |

Shell wording in Hebrew and Arabic has not had native-speaker review.

## Next task

P01-02. Add PostgreSQL, migrations, an isolated test database, and transaction helpers.
