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
