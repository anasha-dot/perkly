# Implementation log

## 2026-10-20 — Phase 00 documents

**Scope:** Documentation required by roadmap version 1.0, tasks P00-01 through P00-04. No application code, git repository, database, infrastructure, or provider integration was created.

**Observable result:** A later coding task can read the product rules, the open choices, the payment checklist, the architecture, and the proposed API without an earlier source tree or an earlier chat.

### Files created

- `docs/PRODUCT_SPEC.md`
- `docs/DECISIONS.md`
- `docs/PAYMENT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/TASK_STATUS.json`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/OWNER_SETUP.md`
- `docs/RELEASE_GATES.md`
- `docs/TEST_STRATEGY.md`
- `docs/project-context.md`

`docs/Perkly_From_Scratch_Roadmap.md` was not modified.

### Behavior

No runtime behavior. Routes in `docs/API.md` are proposed and are not served. `docs/PAYMENT_CONTRACT.md` does not approve a provider and does not name a provider API. E01 remains pending.

### Commands and results

No application test, package install, migration, or server start was run. The document checks in the next entry only prove that the Phase 00 files exist and agree with the roadmap's task list. They are not AT01–AT34.

### Unresolved

- Open choices O-01 through O-04: public-offer maximum, settlement confirmation, PostgreSQL major, payment provider.
- Owner inputs E01–E09, all pending.
- Every Section 7 task from P01-01 onward is `not_started`.
- Release gates G01–G16 are not complete.
- The project is not production-ready.

### Next

P01-01. Acceptance: a new repository with the Vue shell, Express server, TypeScript contracts, lint and format configuration, and locale structure, with root commands that start the app and typecheck it.

## 2026-10-20 — Document checks

These checks were run in this session. They do not execute the application. No AT scenario was run.

Commands:

- `sha256sum docs/Perkly_From_Scratch_Roadmap.md` before writing, and again after writing.
- Existence and byte size of each Phase 00 file.
- Python parse of `docs/TASK_STATUS.json`, compared with Section 7 IDs P00-01 through P11-05.
- A search of the new documents for provider product names and for a claim that tests had passed.

Results:

- Roadmap SHA-256 stayed `d7d17cbf3344578e07a56c80e58396fdc51383f9d1270b8eb551782360710657`.
- All 11 Phase 00 files were present.
- `TASK_STATUS.json` parsed. It contains 57 task IDs, with no missing or extra Section 7 IDs. Status `done` is only P00-01, P00-02, P00-03, and P00-04. The other 53 tasks are `not_started`. `nextUnblockedTask` is P01-01. `releaseState` is `none`.
- `TEST_STRATEGY.md` lists AT01 through AT34, each `not_run`.
- `RELEASE_GATES.md` lists G01 through G16, each not complete.
- `OWNER_SETUP.md` marks E01 through E09 pending.
- No payment-provider product name was introduced. The words "production-ready" appear only to say the project is not production-ready.

The provider sentence in this entry was true when the documents were first written. The next entry records Anas locking PayPlus later the same day.

## 2026-10-20 — PayPlus selected

Superseded for merchant product sales by the D-22 entry below. Do not follow this entry’s merchant-terminal sentence.

**Scope:** Record Anas Hallumi’s provider lock in the existing Phase 00 documents. No application code was written. `Perkly_From_Scratch_Roadmap.md` and `payment-provider-recommendation.md` were not modified.

**Decision:** On 20 October 2026 Anas Hallumi locked PayPlus as Perkly’s payment provider: each merchant has their own PayPlus terminal for product sales, Perkly has a separate terminal for the ₪15 membership, Perkly takes no sales commission, checkout is a hosted payment page only so Perkly never sees PAN or CVV, staging may call only https://restapidev.payplus.co.il and must refuse the production host and live keys, Perkly keeps integer agorot and sends PayPlus exact two-decimal shekels, and tax documents use Invoice+ on the seller’s own account, with Morning, iCount, or an accountant if a merchant will not enable Invoice+, while Perkly still needs an accountant to file VAT. Cardcom is the runner-up only if PayPlus cannot provide an importable chargeback feed or a PAN-free captured-sale refund. E01 is not complete.

### Files changed

- `docs/DECISIONS.md` — added D-21 and closed O-04. O-02 stays open for bank confirmation.
- `docs/PAYMENT_CONTRACT.md` — selected design recorded. No PayPlus row is marked confirmed.
- `docs/project-context.md`
- `docs/OWNER_SETUP.md` — eight E01 questions copied from the recommendation as the next owner action.
- `docs/IMPLEMENTATION_LOG.md`
- `docs/TASK_STATUS.json` — P05-03 set to `blocked_external` on E01. No Phase 05 task is `done`.

### Behavior

No runtime behavior. The local payment simulator was not created. P05-01, P05-02, P05-04, and P05-05 stay `not_started`.

### Commands and results

Document edits only. No application test, package install, migration, or server start was run. SHA-256 of `Perkly_From_Scratch_Roadmap.md` stayed `d7d17cbf3344578e07a56c80e58396fdc51383f9d1270b8eb551782360710657`. SHA-256 of `payment-provider-recommendation.md` stayed `b6703dcbd5f86e92d684a202c8167795207a254c4cbf2640267b283b2631fd4d`. The eight E01 questions in `OWNER_SETUP.md` match the recommendation line for line. `TASK_STATUS.json` parses: P05-03 is `blocked_external`, and P05-01, P05-02, P05-04, and P05-05 are `not_started`.

### Unresolved

E01 remains pending: provider approval, fees, settlement-bank confirmation, the recurring day, idempotency, PAN-free refunds, sandbox proof, and a chargeback export. O-01 and O-03 stay open. Release gates stay incomplete.

### Next

P01-01 remains the next unblocked build task. Anas’s next payment action is to send the eight questions.

## 2026-10-20 — D-22 merchant sales stay outside Perkly

**Scope:** Record Anas Hallumi’s correction and his membership answer. No application code. `Perkly_From_Scratch_Roadmap.md` was not modified. The research body of `payment-provider-recommendation.md` was not rewritten. A status note was added above that research.

**Decision D-22:** Perkly does not process, capture, refund, or settle the payment between the customer and the merchant. PayPlus is not used for merchant product sales. There is no merchant PayPlus terminal. A code activates the discount. The merchant charges the customer on the merchant’s own till. Code format, expiry, single-use, merchant confirmation, and how savings are verified are not decided. Perkly charges the ₪15 membership inside the app, on Perkly’s own PayPlus account and terminal. Hosted payment page only. Perkly never sees PAN or CVV. Cardcom remains the runner-up only for that membership charge, on the D-21 conditions. E01 is only about Perkly’s membership account and is not complete.

### Files changed

- `docs/DECISIONS.md`
- `docs/PRODUCT_SPEC.md`
- `docs/PAYMENT_CONTRACT.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/project-context.md`
- `docs/OWNER_SETUP.md`
- `docs/IMPLEMENTATION_LOG.md`
- `docs/TASK_STATUS.json`
- `docs/payment-provider-recommendation.md` (status note only)

### Task status

`deferred_by_owner` and not the launch path: P04-03, P04-05, P05-01, P05-02, P05-03, P05-04, P05-05, P07-02, P07-03, P07-04. P06-02 is `blocked_external` on the narrower E01. No Phase 05 task is `done`.

### Commands

No application test, install, migration, or server start. `TASK_STATUS.json` was parsed after the status edit. The roadmap file was not rewritten.

## 2026-10-20 — P01-01 local shell

**Scope:** Repository workspaces, Vue shell, Express server, TypeScript contracts, lint and format, and `en` / `he` / `ar` with right-to-left layout. No PostgreSQL, no checkout, and no PayPlus client. Membership billing was not started. `Perkly_From_Scratch_Roadmap.md` was copied and not rewritten.

**Observable result:** `npm run dev` serves the home screen at http://127.0.0.1:5173 and proxies `/api` to the API. Hebrew and Arabic set `dir="rtl"`. `GET /api/v1` returns the service name and `database: "not_connected"`. The worker starts and stays idle. `db:migrate` and `db:seed:local` exit with an error and do not connect.

### Versions

Chosen from current releases on 20 October 2026, then locked in `package-lock.json`.

- Node.js 24.22.0 and npm 11.19.1
- TypeScript 5.9.3. TypeScript 7.0.2 is published, and `typescript-eslint` 8.72.0 accepts only TypeScript below 6.1.0, so 5.9.3 is the newest compatible compiler.
- Vue 3.5.44, Vue Router 5.4.0, Vite 8.3.4, `@vitejs/plugin-vue` 6.0.10, `vue-tsc` 3.3.13
- Express 5.3.0
- ESLint 10.13.0, `typescript-eslint` 8.72.0, `eslint-plugin-vue` 10.11.1, Prettier 3.9.10

The display locale is the stored `perkly.locale` value, otherwise the browser language (`iw` counts as Hebrew), otherwise English. That is a shell default, not a new product decision. Hebrew and Arabic shell strings have not had native-speaker review (E06).

### Commands and results

Run on Node.js 24.22.0 in this session:

- `npm install` added 269 packages. npm reported 0 vulnerabilities.
- `npm run check` passed. That runs typecheck, lint, Prettier check, and unit tests.
- `npm run test:unit` passed 5 tests: English is left to right, Hebrew and Arabic are right to left, stored locale wins, `he-IL` and `iw` resolve to Hebrew, unknown language falls back to English, and the service descriptor has no payment field.
- `npm run build` passed. Vite wrote the web bundle.
- `npm run db:migrate`, `npm run db:seed:local`, `npm run test:integration`, and `npm run test:e2e` each exited 1 and did not connect or execute a database or browser suite.
- `npm run start:api` with `PORT=3099` listened on 127.0.0.1. `GET /api/v1` returned HTTP 200 and `{"name":"perkly","apiVersion":"v1","database":"not_connected"}`.
- `npm run start:worker` printed the idle line and stayed up. An unsettled top-level await makes Node.js 24 exit 13, so the idle worker uses a timer instead.
- `npm run dev` served Vite at http://127.0.0.1:5173 and the API at http://127.0.0.1:3001. `GET http://127.0.0.1:5173/api/v1` returned the same JSON.
- Chrome loaded the home screen, switched English, Hebrew, and Arabic, and a 390px-wide layout kept Hebrew right to left. The page showed the server responding. No checkout control was present.

### Unresolved

- P01-02 is not done. There is no database.
- AT01–AT34 were not run. The unit tests are not those scenarios.
- The Phase 01 gate is not met. The app is not production-ready.
- O-01, O-03, and O-15 stay open. E01–E09 stay pending. E09 now has a GitHub repository and still has no branch protection or deploy identity.

### Next

P01-02. Acceptance: a fresh database migrates, and test or reset commands reject unsafe targets. Do not pin the PostgreSQL major until O-03 is checked.

## 2026-10-20 — P01-02 local PostgreSQL

**Scope:** PostgreSQL Compose, a numbered migration runner, an isolated disposable test database, a transaction helper, and the runtime versus migration role split. No PayPlus client, no checkout, and no merchant payment. O-03 stays open. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** A fresh `perkly_test` database on 127.0.0.1 migrates `0001_foundation`, and running the migration again applies nothing. Dropping and creating that database, then migrating again, applies the same migration and the same checksum. Reset and integration commands refuse a hosted URL, hosted `APP_MODE`, and the dev database `perkly`. The runtime role can read the foundation marker and cannot create a table, write the marker, or write `perkly_meta.schema_migrations`.

PostgreSQL 17 is the Compose image proposal only. The running server reported PostgreSQL 17.11. That does not select the RDS major.

### Commands and results

Docker Compose 2.40.3. Image `postgres:17`. Node.js 24.22.0.

```text
docker compose -f infra/docker-compose.yml up -d --wait
```

Container `perkly-postgres-1` became healthy. Published port `127.0.0.1:5432->5432/tcp`.

```text
docker compose -f infra/docker-compose.yml exec -T postgres psql -U perkly_bootstrap -d postgres -c "SELECT version();"
```

Result: `PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit`.

Init created databases `perkly` and `perkly_test`. Roles: `perkly_bootstrap` is the local superuser; `perkly_migrate` and `perkly_runtime` are not superusers and cannot create databases or roles.

Refusals, each exit 1, with no database change:

- `DATABASE_URL=postgres://perkly_migrate:secret@perkly.abc123.us-east-1.rds.amazonaws.com:5432/perkly_test npm run db:reset:test` — `Refused: the URL points at a hosted database.`
- `DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly npm run db:reset:test` — `Refused: reset-test may only use perkly_test. "perkly" is not that database.`
- `APP_MODE=production npm run db:reset:test` — `Refused: APP_MODE is hosted. This command only accepts a loopback disposable database.`
- `DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly npm run test:integration` — `Refused: test may only use perkly_test. "perkly" is not that database.`
- `DATABASE_URL=postgres://perkly_migrate:secret@203.0.113.10:5432/perkly npm run db:seed:local` — `Refused: host "203.0.113.10" is not loopback.`

Fresh disposable database:

```text
npm run db:reset:test
DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly_test npm run db:migrate
DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly_test npm run db:migrate
```

First migrate: `applied: 0001_foundation`, `already_applied: (none)`. Second migrate: `applied: (none)`, `already_applied: 0001_foundation`. Checksum `c4c89fb808c8f44fe24bad7fb27f73f29597ec84433d02d7a26af7da828898c4`. `app.schema_info.postgres_major_proposal` is 17.

```text
npm run db:reset:test
DATABASE_URL=postgres://perkly_migrate:perkly_local_migrate@127.0.0.1:5432/perkly_test npm run db:migrate
```

Reset left `perkly_test` empty. Migrate applied `0001_foundation` again. Checksum prefix `c4c89fb808c8`.

`npm run db:migrate` with no `DATABASE_URL` migrated dev database `perkly` and applied `0001_foundation`. `npm run db:seed:local` exited 0 and wrote nothing.

`npm run test:integration` passed one test: the fresh disposable database migrated the same way twice, the transaction helper rolled back an insert, and the runtime role received SQLSTATE 42501 for DDL, for a marker write, and for a migration-table write.

`npm run test:unit` passed 12 tests, including the target guards.

### Unresolved

- O-03 stays open. Local 17.11 is not an RDS decision.
- The API and worker still do not connect to PostgreSQL. `GET /api/v1` still reports `database: "not_connected"`.
- Seed rows are not loaded. That is P01-03.
- Runtime grants for an audit table are P01-05.
- AT01–AT34 were not run. `test:e2e` is not implemented. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P01-03. Acceptance: local mode runs without AWS, and hosted configuration rejects demo identity, simulator payments, and demo search. P01-05 is also unblocked.

## 2026-10-20 — P01-03 adapters and local seed

**Scope:** Environment validation, adapter selection, and a local-only fictional seed with fixture profiles, search fixtures, and an email outbox. No PayPlus client, no checkout, no merchant payment adapter, and no membership billing. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** With no AWS credentials, the API starts in local mode and selects fictional profiles, the outbox, fixture search, local images, and disabled payment. A hosted configuration that names Cognito, SES, Bedrock or filters, and S3 also starts without contacting AWS. Hosted startup exits before listening when identity, email, search, or payment is a local or demo adapter. `db:seed:local` writes 5 profiles, 1 outbox row, and 3 search fixtures on loopback `perkly`. A second run keeps those counts. The outbox row says it was not sent. Seed and reset still refuse non-local and non-disposable targets.

### Commands and results

Node.js 24.22.0. PostgreSQL was already the local Compose database from P01-02.

```text
npm run db:migrate
```

`database: perkly`, `applied: (none)`, `already_applied: 0001_foundation, 0002_local_fixtures`, exit 0. The new migration had already been applied by the integration test in this session.

```text
npm run db:seed:local
npm run db:seed:local
```

Both exited 0 with `profiles: 5`, `outbox: 1`, `search_fixtures: 3`, and `Fictional rows are local only. The outbox message was not sent.`

`psql` counts on `perkly`: 5 profiles, 1 outbox row (`fixture-outbox-seed`, subject `Local outbox only`), 3 search fixtures.

```text
PORT=34572 npm run start:api
```

Listened without AWS settings. `GET /api/v1` returned `mode` `local`, adapters `local-fixtures`, `outbox`, `fixtures`, `local`, and `payment` `disabled`, with `database` still `not_connected`.

Refusals, each exit 1:

- `DATABASE_URL=postgres://perkly_migrate:secret@203.0.113.20:5432/perkly npm run db:seed:local` — `Refused: host "203.0.113.20" is not loopback.`
- Reset of database `perkly` — `Refused: reset-test may only use perkly_test.`
- `APP_MODE=production npm run db:reset:test` — `Refused: APP_MODE is hosted.`
- `test:integration` pointed at `perkly` — `Refused: test may only use perkly_test.`
- Staging `AUTH_PROVIDER=local` on `start:api` — `Refused: hosted mode rejects demo identity.` The process did not listen.
- Production `SEARCH_PROVIDER=fixtures` on `start:worker` — `Refused: hosted mode rejects demo search.`
- Staging `PAYMENT_PROVIDER=simulator` on `start:api` — `Refused: hosted mode rejects simulator payments.`

`npm run test:integration` passed 2 tests: fresh `perkly_test` migration of both files, and idempotent seed on `perkly` with runtime SQLSTATE 42501 on a profile insert.

`npm run check` passed: typecheck, lint, Prettier, and 22 unit tests. The unit tests also start a valid hosted adapter set without AWS credentials and reject demo adapters before listen.

### Unresolved

- O-03 stays open.
- The API still does not connect to PostgreSQL. There is no session login. That is P02-01, after P01-05.
- Cognito, SES, S3, and Bedrock are accepted names in hosted configuration only. No AWS call is made. No model ID is chosen.
- Membership billing is not started. Payment stays `disabled`.
- AT01–AT34 were not run. `test:e2e` is not implemented. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged.

### Next

P01-04. Acceptance: CI, a native-database smoke test, a browser smoke test, a production build, and a non-root container run. P01-05 remains unblocked.

## 2026-10-20 — P01-04 CI and smoke checks

**Scope:** GitHub Actions, a native PostgreSQL smoke test, a browser smoke test, the production build, and a non-root Docker build and run. Lockfile remains committed. No PayPlus client, checkout, merchant payment, or membership billing. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** `npm run test:smoke:database` migrates disposable `perkly_test` on PostgreSQL 17 and reads the foundation marker as the runtime role. `npm run test:e2e` opens the home screen, sees English and the local API, then Hebrew right to left, and finds no checkout button. `npm run build` writes the web bundle and compiled API. `sh scripts/check-container.sh perkly:local` builds `infra/Dockerfile` from `node:24.22.0-bookworm-slim` and runs it as uid 1000 (`node`). `GET /api/v1` inside that container returns `payment` `disabled`.

### Commands and results

Node.js 24.22.0. Local Compose PostgreSQL was already healthy on 127.0.0.1:5432.

```text
npm run test:smoke:database
```

1 passed. `native postgres smoke migrates the disposable database`.

```text
npm run test:e2e
```

1 passed. `home screen answers in English and switches to Hebrew right to left` (204ms). Playwright Chromium.

```text
npm run build
node apps/api/dist/main.js
```

Vite wrote `apps/web/dist`. The compiled API listened on 127.0.0.1:34573 and `GET /api/v1` returned local adapters with `payment` `disabled`.

```text
sh scripts/check-container.sh perkly:local
```

Image `perkly:local` built from `node:24.22.0-bookworm-slim` (`sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5`). Run check:

- `uid:1000`
- `id:uid=1000(node) gid=1000(node) groups=1000(node)`
- body: `{"name":"perkly","apiVersion":"v1","database":"not_connected","mode":"local","adapters":{"identity":"local-fixtures","email":"outbox","search":"fixtures","images":"local","payment":"disabled"}}`

Exit 0. The process was not root.

`npm run check` passed: typecheck, lint, Prettier, and 22 unit tests.

`package-lock.json` includes `@playwright/test` 1.64.1 and is committed with this change.

### Unresolved

- GitHub Actions run 39412383692 on `perkly/foundation` passed: `check`, `database`, `browser`, and `container`.
- O-03 stays open. The API still does not connect to PostgreSQL on startup.
- AT01–AT34 were not run. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P01-05. Acceptance: redacted logs, request IDs, the error schema, health and shutdown, an append-only audit table, and runtime grants that cannot change schema or prior audit rows.

## 2026-10-20 — P01-05 health, logs, and audit grants

**Scope:** Structured redacted logs, request IDs, the error schema, process health and readiness, graceful shutdown, and migration `0003_audit_events`. No PayPlus client, checkout, merchant payment, or membership billing. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** `GET /api/v1/health` returns `{ "status": "ok", "service": "perkly-api" }` and no database URL. Without `DATABASE_URL`, readiness says the database is `not_configured`. With the local runtime URL, readiness says the database is `ok` and still omits the URL. Unknown paths return `code`, `requestId`, and `fieldErrors`, and the response header repeats the request id. Logs are one JSON object per line and replace postgres URLs and password fields with `[redacted]`. SIGTERM logs `shutdown_started` then `shutdown_complete`. The runtime role can insert an audit event and cannot update, delete, truncate, or alter it. The migration role cannot update a prior audit row either. The original action stays `foundation.ready`.

### Commands and results

Node.js 24.22.0. Local PostgreSQL was already healthy.

```text
npm run test:unit
npm run test:smoke:database
npm run test:integration
npm run test:e2e
npm run check
```

`test:unit` passed 25 tests, including redaction and health responses. `test:smoke:database` passed and applied `0003_audit_events`. `test:integration` passed 2 tests. The migration test rejected runtime and migration `UPDATE`, runtime `DELETE`, `TRUNCATE`, and `ALTER` with SQLSTATE 42501, then read the original action `foundation.ready`. `test:e2e` passed. `npm run check` passed: typecheck, lint, Prettier, and the same 25 unit tests.

```text
PORT=34574 npm run start:api
```

- `GET /api/v1/health` → `{"status":"ok","service":"perkly-api"}`
- `GET /api/v1/ready` → `{"status":"ready","checks":{"process":"ok","database":"not_configured"}}`
- `GET /api/v1/missing` → 404 `{"code":"not_found","requestId":"req_a840d7ee194bfb2ddd5009e5","fieldErrors":[]}` with the same `x-request-id`

```text
DATABASE_URL=postgres://perkly_runtime:perkly_local_runtime@127.0.0.1:5432/perkly PORT=34575 npm run start:api
```

`GET /api/v1/ready` → `{"status":"ready","checks":{"process":"ok","database":"ok"}}`. The body did not include the URL.

```text
PORT=34576 node apps/api/src/main.ts
kill -TERM <pid>
```

The log contained `shutdown_started` and `shutdown_complete` for `SIGTERM`.

### Unresolved

- O-03 stays open. There is still no session login. That is P02-01.
- AT01–AT34 were not run. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P02-01. Acceptance: hashed server sessions and the loopback-only fictional identity adapter, with a local customer session and a local staff session.

## 2026-10-20 — P02-01 local sessions

**Scope:** User and session rows, hashed opaque session tokens, and the loopback-only fictional identity adapter. A customer session and a staff session were opened from fixture profiles. No password column, no PayPlus client, no checkout, and no membership billing. This adapter is not production authentication. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** `POST /api/v1/auth/local/session` with `fixture-customer-nour` returns role `customer` and `fictional: true`. The same route with `fixture-cashier-omar` returns role `cashier`. The HttpOnly cookie is the only copy of the raw token. `app.sessions.token_hash` is the SHA-256 of that cookie and is not equal to it. Logout returns 204 and the cookie no longer loads a session. Hosted mode returns 404 `local_identity_unavailable`. A non-loopback client address is refused.

### Commands and results

Node.js 24.22.0. Local PostgreSQL was already healthy.

```text
npm run test:unit
npm run test:smoke:database
npm run test:integration
npm run test:e2e
npm run check
```

`test:unit` passed 28 tests. `test:smoke:database` passed and applied `0004_users_sessions`. `test:integration` passed 2 tests, including the customer and cashier session flow and the check that the stored hash is not the raw token. `test:e2e` passed. `npm run check` passed: typecheck, lint, Prettier, and the same 28 unit tests.

```text
DATABASE_URL=postgres://perkly_runtime:perkly_local_runtime@127.0.0.1:5432/perkly PORT=34577 node apps/api/src/main.ts
```

- Customer profile `fixture-customer-nour`: role `customer`, `fictional` true, `identityProvider` `local-fixtures`. The JSON body did not contain the cookie. `Set-Cookie` was HttpOnly.
- `GET /api/v1/session` with that cookie returned capability `customer`.
- Staff profile `fixture-cashier-omar`: role `cashier`, `fictional` true.
- `GET /api/v1/session` with the staff cookie returned capability `cashier`.
- SQL `token_hash = <raw staff cookie>` was false.

### Unresolved

- Cognito login is not implemented. That is P02-02.
- CSRF is returned on the session but not enforced on mutations. That is P02-03.
- O-03 stays open. AT01–AT34 were not run. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P02-02. Acceptance: Cognito authorization-code with PKCE, state, nonce, refresh, and logout, plus a separate admin pool. Hosted proof waits for Phase 10.

## 2026-10-20 — P02-02 Cognito authorization-code

**Scope:** Cognito authorization-code with PKCE, server-side state and nonce, verified identity claims, refresh, logout, and a separate admin pool configuration. Protocol failures were tested against a loopback identity provider. No AWS account exists, and this is not a hosted Cognito deployment. No PayPlus client, checkout, merchant payment, or membership billing was added. The loopback fixture adapter stays unavailable in hosted mode. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** `GET /api/v1/auth/login?pool=customer` redirects to the customer hosted UI with `response_type=code`, S256 PKCE, state, and nonce. The database stores hashes of the state, nonce, and verifier. The callback clears the verifier, checks the issuer, audience, expiry, nonce, and `email_verified`, and sets an HttpOnly `perkly_session` cookie. `app.sessions.token_hash` is the SHA-256 of that cookie. The session JSON has `pool: customer`, `fictional: false`, and no refresh token. The same flow with `pool=admin` returns role `admin_pool` and does not change the customer session. A customer-issuer token on an admin callback returns `issuer_mismatch`. Reused state, a bad verifier, an unverified email, and an expired token fail. Refresh rotates the stored refresh token without returning it. A changed subject returns `identity_mismatch` and ends the session. Logout revokes the refresh token at the provider and still returns 204 when that call fails. `POST /api/v1/auth/local/session` on that configuration returns 404 `local_identity_unavailable`.

### Commands and results

Node.js 24.22.0. Local PostgreSQL 17 was already healthy. There is no AWS account.

```text
npm run test:unit
npm run test:smoke:database
npm run test:integration
npm run test:e2e
npm run check
```

`test:unit` passed 36 tests, including PKCE, claim failures, signature failure, separate pool settings, and hosted startup that does not contact the issuers. `test:smoke:database` passed and applied `0005_cognito_identity`. `test:integration` passed 3 tests. The Cognito test covered customer and admin login, issuer mismatch, nonce mismatch, unverified email, expiry, bad PKCE, reused and expired state, refresh success and failure, subject mismatch, logout revoke, and logout when revoke fails. `test:e2e` passed. `npm run check` passed: typecheck, lint, Prettier, and the same 36 unit tests.

### Unresolved

- No hosted Cognito user pool was deployed or called. Admin MFA was not verified. That proof is Phase 10.
- CSRF is returned on the session but not enforced on mutations. That is P02-03.
- `admin_pool` records which pool issued the session. It is not an application permission grant.
- O-03 stays open. AT01–AT34 were not run. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P02-03. Acceptance: permission and tenant guards, CSRF, exact Origin, Secure and HttpOnly cookie rules, rate limits, staff-role authority, and admin assurance. A customer-pool session must not become an admin grant.

## 2026-10-20 — P02-03 permission guards

**Scope:** Permission and tenant guards, CSRF, exact Origin checks, Secure and HttpOnly cookie rules, rate limits, staff-role authority, and admin assurance. Cross-user and cross-business ids fail. A customer-pool session fails on the admin route. No PayPlus client, checkout, merchant payment, or membership billing was added. No hosted Cognito deployment is claimed. `Perkly_From_Scratch_Roadmap.md` was not rewritten.

**Observable result:** `GET /api/v1/users/:userId` for another user returns 404 and does not include that user's email. A cashier of `fixture-business-north` receives 404 for `fixture-business-south` with no business display name. The same cashier's invite is 403 `not_allowed` even when the body says `business_owner`. The north owner receives 403 `not_in_this_build` because invitations are not built. Samir is a cashier of the south fixture, so that role does not grant the north owner's invite. Mutations require `Origin` equal to `APP_ORIGIN`. An active logout or staff invite also requires `x-csrf-token`. A failed check does not revoke the session. Cookies are HttpOnly and `SameSite=Lax`, and Secure when the origin is https. A bearer header is not a session. `GET /api/v1/admin/assurance` is 403 for a customer-pool session after an `app.admin_grants` insert, and 200 `{ "assured": true }` for an admin-pool session with that grant. The runtime role cannot insert businesses, memberships, or grants. Access routes return 429 `rate_limited` after 60 hits in a minute.

### Commands and results

Node.js 24.22.0. Local PostgreSQL 17 was already healthy. There is no AWS account.

```text
npm run test:unit
npm run test:smoke:database
npm run test:integration
npm run test:e2e
npm run check
```

`test:unit` passed 40 tests. `test:smoke:database` passed and applied `0006_access_control`. `test:integration` passed 4 tests, including the tenant, CSRF, Origin, rate-limit, and customer-pool admin cases. `test:e2e` passed. `npm run check` passed: typecheck, lint, Prettier, and the same 40 unit tests.

### Unresolved

- Staff invitations, merchant applications, and account editing are not built. The owner invite returns `not_in_this_build`.
- Admin MFA was not verified. There is no hosted Cognito deployment.
- Session expiry and the account UI are P02-04.
- O-03 stays open. AT01–AT34 were not run. The app is not production-ready.
- E01–E09 stay pending. D-22 is unchanged. No merchant payment was added.

### Next

P02-04. Acceptance: account, profile, and session-expiry flows, language preference, authentication UI, and protected route states. An expired browser session cannot silently submit a purchase under another identity.
