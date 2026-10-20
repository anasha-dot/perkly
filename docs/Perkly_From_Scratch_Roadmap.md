# Perkly — From-Scratch Production Roadmap

**Owner:** Anas Hallumi  
**Date:** 20 October 2026  
**Version:** 1.0  
**Starting point:** an empty repository; no existing application code required  
**Target:** a production web/PWA application in the owner's AWS account

This is a standalone specification for building a new Perkly application. Give this file to your coding bot. It contains the product rules, architecture, database design, workflows, ordered implementation tasks, tests, owner setup and launch gates. Every component is **planned and unbuilt** for this new project; no previous test result counts as evidence for it.

The earlier source ZIP and implementation roadmap are not dependencies. All paths, scripts, endpoint names and configuration names below are **proposed outputs to create**, not files or features that already exist. Preserve the agreed product decisions while implementing the new code.

## 1. Start your bot with this prompt

Create an empty project folder, put this document inside it, and paste the following:

```text
Build a NEW Perkly application from scratch for Anas Hallumi.
Read Perkly_From_Scratch_Roadmap.md completely and follow its task IDs,
business rules, acceptance criteria and production gates.

Start in a new repository/folder. Do not require, import or adapt the earlier
Perkly source ZIP. Do not assume that any code, routes, tests or infrastructure
already exist. Respect any actual repository instructions. If the selected
directory contains unrelated work, create a separate new folder and preserve it.

Use the proposed Vue 3 + TypeScript frontend, Node.js 24 LTS + Express backend,
PostgreSQL database and modular monolith architecture. Build a separate worker
process, a responsive installable web/PWA, English/Hebrew/Arabic with RTL,
Cognito identity, Bedrock search and AWS CDK deployment. Verify compatible
dependency versions at initialization and commit lockfiles.

The business model is fixed unless Anas changes it: free public offers;
optional ILS 15 per calendar-month membership; an EXTRA merchant-funded 3%
after public discounts at participating businesses; public percentage offers
at least 3%; no platform sales commission at launch. Use integer agorot and
separate public savings, membership savings and actual membership fees.

Build a runnable local version first using native PostgreSQL, a local-only
identity adapter, simulated payments, a local email outbox and deterministic
search fixtures. It must work without an AWS account. Real identity, provider,
email and Bedrock adapters are separate integration work. Simulators must be
impossible to enable in hosted staging/production.

Start with P00-01. Create the documentation and task tracking defined in this
roadmap, then implement the next unblocked task. Deliver working vertical
slices with tests, not only UI mockups or more plans. Build on your new code
incrementally. Do not repeatedly recreate the project.

Anas handles external accounts, contracts, domain/email setup and approvals.
Prepare exact instructions and continue all code work that does not depend on
missing external inputs. Do not ask permission after every routine coding step.
Do not request secrets in chat, invent provider APIs or pretend that mock
results are real integration evidence.

For payments, use the selected provider's approved documentation and a typed
adapter. Require server-confirmed captures, durable idempotency, stock holds,
authenticated webhooks, bounded refunds, confirmed paid membership periods,
reconciliation and immutable financial history. Unknown outcomes stay unknown
until authoritative lookup resolves them. A return URL is not proof of payment.

Keep Bedrock limited to extracting search intent. Match only approved, fresh
branch facts; never invent businesses, prices, availability or child-safety
claims. Ask for missing information and preserve ordinary search when AI fails.

Record actual checks and blockers in docs/IMPLEMENTATION_LOG.md and
docs/TASK_STATUS.json. Keep docs/DECISIONS.md and docs/OWNER_SETUP.md current.
Continue unblocked implementation automatically. Pause only where an external
decision, access or action genuinely blocks that task, then continue elsewhere.

Prepare deployments and live financial tests for owner review. Do not create
billable infrastructure, publish, send real messages, make paid AI calls, or
charge/refund real money without the relevant authorization and configuration.
Reuse authorization already provided for a specific action.

Do not mark the application production-ready until the required release
evidence exists. Report completed task IDs, behavior delivered, tests actually
run, remaining risks, owner inputs needed and the next unblocked task.
Begin with Phase 00 now.
```

## 2. Product contract

### 2.1 What Perkly does

Perkly connects customers with participating local businesses offering products, services and surplus stock. Customers can discover offers, pay through the app and redeem their purchase. Businesses manage their Perkly catalogue, stock, offers and fulfilment. Members receive an additional saving across participating businesses and can see whether those savings cover their subscription.

Start with a controlled pilot near Kfar Manda, then expand geographically after reliable fulfilment and repeat customer value are demonstrated. The first release supports collection/pickup. A service purchase is an entitlement with clear redemption terms, not a guaranteed appointment slot.

### 2.2 Business rules to implement

| Rule | Specification |
| --- | --- |
| Free customers | Can browse, use public offers, buy, collect purchases, request support/refunds and review eligible completed purchases. |
| Membership | Optional ₪15 per calendar-month billing interval on the confirmed provider billing anchor. It is not automatically a fixed 30-day interval or the first day of the month. |
| Member saving | Additional 3% on the eligible amount after public offers at participating businesses. The business funds the discount. |
| Public promotion | Published percentage offers have a minimum discount of 3%. Proposed launch validation: 3–90%; record the maximum as a product decision. A product may have no public promotion. |
| Offer selection | Apply the best eligible approved public offer for each line, then the member benefit once. No accidental stacking of several public offers. |
| Platform commission | None at launch. Do not introduce a buyer fee, seller cut or discount-sharing fee silently. |
| Settlement | Proposed provider-approved model: merchant sales settle to the merchant's account; Perkly membership payments settle to Perkly's separate account. Confirm this commercially before real integration. |
| Provider fees | Merchants bear their sale acquiring fees; Perkly bears its membership collection costs under the actual provider agreement. |
| Prices | ILS only; store integer agorot. Show the full customer total, including applicable taxes under the approved policy. The subscription price shown to the customer remains ₪15. |
| Purchase boundary | One business and one branch per basket/payment. |
| Benefit eligibility | Make participating-business coverage explicit. No hidden product exclusion or checkout surcharge that contradicts the advertised 3% benefit. Unsupported purchase categories require a documented public policy. |
| Languages | English, Hebrew and Arabic throughout customer, merchant, support and essential admin flows, including receipts/notifications where controlled by Perkly. |
| Delivery format | Responsive installable web/PWA first. Native app-store packages are a later milestone. |

The app cannot guarantee that a business will never offer a lower direct price. Its value should come from reliable savings, useful discovery, simple checkout/collection, trustworthy merchant facts and repeat use. Verified purchase ranking is an incentive and a trust signal, not proof that every top-ranked product is best.

### 2.3 Pricing examples and savings

| Reference price | Public offer | Free price | Extra member saving | Member price |
| ---: | ---: | ---: | ---: | ---: |
| ₪100.00 | None | ₪100.00 | ₪3.00 | ₪97.00 |
| ₪100.00 | 3% | ₪97.00 | ₪2.91 | ₪94.09 |
| ₪100.00 | 10% | ₪90.00 | ₪2.70 | ₪87.30 |
| ₪100.00 | 20% | ₪80.00 | ₪2.40 | ₪77.60 |

The extra 3% is sequential. A 10% public offer plus membership produces a 12.7% total reduction, not 13%.

At 3%, ₪500 of eligible spending **after public offers and before the member discount** generates ₪15 of extra savings before transaction rounding. Show this as an illustration, not guaranteed customer behavior.

Maintain separate public savings, member savings and net member value. Net member value equals confirmed additional savings, adjusted for returned purchases, minus actual membership fees plus confirmed fee refunds. Use the same reporting window throughout. Free offers never inflate the membership benefit.

### 2.4 Scope boundaries

**Build for first launch:** accounts and roles; business onboarding; branches/staff; product/service/surplus listings; allocated inventory and CSV imports; approved offers; discovery and AI intent search; cart and cashier bill QR; hosted payment; single-use pickup; refunds; membership; verified reviews; support; notifications; privacy operations; financial reconciliation; admin; PWA; AWS deployment and operating tools.

**Later:** advertising, sponsored placement, prize draws, cashback wallets, financing/lending, platform custody of merchant money, delivery logistics, multi-business baskets, appointment scheduling, universal POS synchronization and native store releases. These require separate product decisions; they are not prerequisites for the first revenue model.

## 3. Build sequence at a glance

| Phase | Deliverable you can demonstrate |
| --- | --- |
| 00 | Clear product rules, provider requirements, architecture and task tracking. |
| 01 | A new project runs locally, connects to PostgreSQL and passes CI. |
| 02 | Customer/merchant/admin access works with enforced permissions. |
| 03 | A merchant creates stock and an offer; a customer discovers it. |
| 04 | A customer receives an accurate server quote with reserved stock. |
| 05 | A purchase completes locally; the real provider adapter passes sandbox checks when available. |
| 06 | Membership billing, the extra 3%, cancellation and net savings work. |
| 07 | Collection, refunds, disputes, receipts and settlement reporting work. |
| 08 | Natural-language discovery matches actual branch facts in three languages. |
| 09 | Full language, privacy, notification, security and usability requirements are complete. |
| 10 | The app runs on AWS staging with deployment, alerts, restore and rollback evidence. |
| 11 | A qualified release completes a controlled live pilot and receives a launch decision. |

These are dependency-based milestones, not promised calendar dates. Work on unblocked tasks when provider/account setup is pending. Account setup can proceed alongside code; it should not prevent a useful local build.

## 4. Proposed stack and repository

### 4.1 Keep the implementation small

Use a **modular monolith**: one backend codebase with clear modules, plus a separate worker process using the same release artifact. The frontend, backend and worker live in one repository. PostgreSQL is the source of truth for money, inventory and jobs.

| Layer | Proposed choice | Reason for this project |
| --- | --- | --- |
| Web | Vue 3, TypeScript, Vite and Vue Router | Fits the owner's development background and supports a responsive application without a separate native codebase. |
| UI/localization | Reusable components, accessible forms and one locale system | Add RTL and message keys from the first screen, not as a final rewrite. |
| Backend | Node.js 24 LTS, TypeScript, Express | Familiar JavaScript stack; isolate business logic from route handlers. |
| Database | Native PostgreSQL locally and RDS PostgreSQL on AWS | One transaction model for stock, idempotency and financial records. Select a supported RDS major version and use that same major in development/CI. PostgreSQL 17 is a proposed starting choice, subject to account-region validation. |
| Database access | `pg` with parameterized SQL, typed repositories and numbered migrations | Make transaction boundaries and locking explicit. An ORM is optional only if these guarantees remain clear. |
| Jobs | PostgreSQL transactional outbox and leased job queue | Avoid a second queue system for the initial scale. Keep the worker separable for later changes. |
| Auth | Cognito customer pool plus separate admin pool with mandatory MFA | External identity management with server-controlled application roles. |
| Payments | A typed provider interface and one approved provider adapter | Local simulation and real integration share business contracts without guessed API endpoints. |
| Search | Ordinary SQL filtering plus Bedrock structured intent extraction | AI interprets language; deterministic code validates facts and returns businesses. |
| Media/email | Private S3 with CloudFront OAC; SES transactional email | Separate public merchant images from private records and process email through jobs. |
| Hosting | ECS Fargate API/worker, ALB, RDS, Secrets Manager, CloudWatch and AWS CDK | Reproducible infrastructure under the owner's AWS account. |
| Verification | Unit/integration tests, native PostgreSQL concurrency tests and Playwright browser flows | Verify behavior, access boundaries and failure recovery. |

At initialization, install supported compatible package versions, record them and commit lockfiles. Node 24 is listed as LTS in the official release reference checked for this plan. Do not pin an old patch merely because a previous project used it.

Do not introduce Kubernetes, multiple databases, microservices, Redis or a vector database without a demonstrated need. Public discovery SEO can be evaluated later; it does not require changing the transaction system.

### 4.2 Paths the bot should create

| Proposed path | Responsibility |
| --- | --- |
| `apps/web/` | Vue application, routes, components, locale messages and PWA assets. |
| `apps/api/` | Express server, HTTP validation, auth/session handling and application composition. |
| `apps/worker/` | Durable jobs, provider recovery, notifications and reconciliation. |
| `packages/domain/` | Pricing, permissions, order/refund/member rules; no network dependencies. |
| `packages/contracts/` | Shared schemas, public API DTOs and generated/documented API contract. |
| `packages/database/` | Connection management, repositories, transactions, migrations and runtime grants. |
| `packages/integrations/` | Payment, identity, email, object storage and AI adapters. |
| `packages/search/` | Intent schema, fact matching, distance calculation and evaluation fixtures. |
| `infra/` | CDK stacks, environment context and infrastructure assertions. |
| `scripts/` | Local setup, migrations, seed, one-off bootstrap, evaluations and release tooling. |
| `tests/` | Unit, integration, concurrency, contract and browser tests. |
| `docs/` | Decisions, API/state contracts, task log, setup, evidence, runbooks and release records. |

The development server should proxy API calls under the web origin. In hosting, serve the compiled Vue app and API from the same HTTPS application origin. This simplifies session cookies, callbacks and CSRF. CloudFront initially serves merchant images; it need not sit in front of the authenticated application.

### 4.3 Local development without AWS

Provide Docker Compose for a real local PostgreSQL database, with a separate disposable test database. Allow an installed PostgreSQL instance as an alternative. Keep the database on loopback and local credentials non-production.

Implement explicit adapters:

| Capability | Local mode | Hosted mode |
| --- | --- | --- |
| Identity | Fixed fictional profiles, localhost only | Real Cognito, verified tokens and server sessions |
| Purchase/membership | Deterministic simulator, no card collection | Selected provider sandbox or live account, explicitly identified |
| Email | Local outbox view | SES with delivery/suppression handling |
| Search | Fixtures and ordinary filters | Approved Bedrock model or ordinary filters |
| Images | Local validated image directory | Validated images in private S3 via public media CDN |

Hosted startup must reject demo identity, simulator payments and demo search. Do not implement a local password system that accidentally becomes the production authentication system.

Create these root script contracts during Phase 01: `dev`, `db:migrate`, `db:seed:local`, `typecheck`, `test:unit`, `test:integration`, `test:e2e`, `build`, `check`, `start:api` and `start:worker`. These names are deliverables, not runnable commands until the bot has implemented them. Seed/reset commands must refuse non-local/non-disposable targets.

## 5. Screens and roles

### 5.1 Customer screens

Discovery/search; business and branch profile; offer/product detail; basket and quote; cashier bill QR; hosted checkout return/pending state; order detail and pickup code; order history; refund request/status; membership offer/consent/status/cancellation; savings; favourites; notifications; verified review; support; account export/deletion; legal and accessibility information.

Every purchase screen must show merchant identity, branch, the final amount, pickup/redemption conditions and current status. A closed payment tab must not leave the customer unable to discover whether they paid.

### 5.2 Merchant screens

Application and provider-onboarding status; dashboard; branch profile and facts; staff invitations/roles; products/services/surplus; images; allocated inventory; CSV preview/import results; offer creation/review/status; paid orders; mark ready; cashier bill QR; pickup scanner/manual fallback; refund review; transaction/refund/settlement reports; support.

An amount-only bill is entered after the merchant's public discounts. It cannot infer which stock items were purchased. For automatic Perkly stock changes, use catalogue checkout. External shop/POS inventory is not synchronized merely because a bill was paid through Perkly.

### 5.3 Admin screens

Merchant/offer review; suspension and complaint handling; provider-onboarding visibility; payment/refund exceptions; job retry; settlements/disputes; receipt delivery issues; support; moderation; privacy operations; audit history; operating health and release controls.

No admin screen should offer arbitrary “mark as paid,” unverified entitlement grants or deletion of financial history. Corrections must represent verified events or an explicitly authorized adjustment with a traceable reason.

### 5.4 Server-enforced permission policy

| Capability | Customer | Cashier | Manager | Business owner | Administrator |
| --- | --- | --- | --- | --- | --- |
| Personal orders/member account | Own | Own personal account | Own personal account | Own personal account | Own personal account |
| Business fulfilment/bill QR | No | Assigned business/branch scope | Assigned scope | Owned business | Audited operational workflow |
| Inventory/catalogue/offers | No | No by default | Assigned scope | Owned business | Moderation/correction workflow |
| Approve purchase refund | Request only | No | Assigned scope | Owned business | Audited review |
| Business reports | Own receipts only | No | Explicit approved report scope | Owned business | Audited operational scope |
| Invite staff/change owner/provider details | No | No | No by default | Restricted owner workflow | Restricted provisioning workflow |
| Approve merchants/offers, retry jobs | No | No | No | No | Yes |
| Grant admin rights | No | No | No | No | Restricted separate provisioning process |

Validate ownership on every route, export and background action. An actor may have multiple roles; that must not create cross-business access. Protect sensitive identity/provider changes with reauthentication and the provider's approved controls.

## 6. Data model and domain contracts

### 6.1 Proposed database groups

Create migrations incrementally in the phase that owns the data, using this model as the common design.

| Group | Proposed entities and key fields |
| --- | --- |
| Identity | Users with immutable internal ID, identity-provider subject/pool, email verification and locale; sessions with hashed tokens/expiry; OAuth flows with state/nonce/PKCE. |
| Merchants | Businesses with approval status and provider seller reference; branches with address/coordinates/timezone; staff membership/role/scope; email-bound expiring invitations; versioned merchant consent. |
| Facts | Branch amenities with structured values, source, verification level, confirmed time and expiry. Store facilities at branch level from the beginning. |
| Catalogue | Products/services/surplus linked to merchant/branch, integer reference price, active status, stock-tracking mode and terms; validated media references. |
| Offers | Product offer, percentage, start/end, pickup interval, reference-price evidence, approval state and review history. |
| Inventory | Branch/product available and reserved quantities, optimistic version, reservations and append-only stock movements. |
| Orders | User, merchant, branch, quote expiry, immutable line snapshots, totals, membership eligibility snapshot and fulfilment state. |
| Bill requests | Merchant/branch, post-public amount, expiry and opaque one-use claim token. Do not store guessed product quantities. |
| Payments | Attempt reference, order, provider/environment/account, amount/currency, provider ID, state and verification time; one active/unresolved attempt per order. |
| Refunds | Request/review, affected quantities/allocations, stable provider operation, verified refunded total and explicit restock decision. |
| Membership | Agreement, consent/version, provider ID/state and billing anchor; confirmed invoice periods with amount, start/end, refund amount and separate access revocation. |
| Finance | Append-only journal, imported provider events, reconciliation runs/exceptions, settlements/lines, fees, disputes and invoice/credit-document references. |
| Operations | Idempotency records, webhook inbox, leased jobs/outbox, audit events, notifications/delivery, support cases, privacy workflow/actions and rate buckets. |
| Trust | Favourites, verified-purchase reviews, moderation reports and bounded anti-abuse signals. |

Use foreign keys, check constraints, scoped uniqueness and appropriate indexes. Money is bounded integer agorot; percentage rates are integer basis points. Identify both provider and environment in external identifiers. Do not use emails, mutable product names or browser-provided merchant IDs as financial authority.

Keep append-only event history distinct from derived balances. This initial journal supports reconciliation and audit; it is not automatically a full accounting general ledger. Map accountant-approved reports separately. Minimize personal data in immutable records so the approved privacy/retention workflow remains possible.

### 6.2 Exact pricing algorithm

1. Validate product/branch/merchant, active offer, quantity and customer membership on the server.
2. Calculate the extended reference amount for each line using integer arithmetic.
3. Apply the eligible public percentage to each extended line, rounding half-up to one agora.
4. Sum post-public line amounts.
5. For an eligible paid member, calculate 3% of that total, rounding half-up once.
6. Allocate member savings back to lines proportionally using largest remainders and a deterministic tie rule.
7. Save immutable original/public/member/paid amounts with each line and order.
8. Calculate partial quantity refunds cumulatively from those original allocations. For a 100-agorot paid line of quantity three, successive one-unit refunds are 33, 33 and 34 agorot.

The sum of line amounts always equals the order total. Zero/negative charges are rejected or handled by a separately designed free-order flow; do not send a zero payment accidentally. Define explicit price/quantity/order limits, and use BigInt or equally exact intermediate arithmetic so multiplication does not overflow.

### 6.3 Stock and quote lifecycle

Use short transactions and a stable row-lock order. A quote moves units from available to reserved, creates the order snapshot and records its expiry atomically. Proposed defaults: ten-minute maximum holds and at most three active customer holds. Bound expiry by offer/pickup end and membership eligibility end where applicable.

Verified capture consumes reserved units. Cancellation/decline/expiry releases them once. CSV inputs describe **available-to-sell Perkly stock**, not total physical stock; they cannot reset held units. Use version checks and atomic imports to avoid lost updates. Changing a product's branch or tracking mode while holds exist must be blocked or explicitly migrated.

A late capture after a hold expires must either reacquire every required unit and fulfil the original price/terms, or trigger one compensating refund. Never take some units and leave a partially funded order without a designed partial-fulfilment flow. Never silently reprice an already captured payment.

### 6.4 State machines

Keep payment, fulfilment, refund and settlement states distinct. Suggested states:

| Entity | States / required distinction |
| --- | --- |
| Order | Quoted, awaiting payment, paid, ready, fulfilled, cancelled, expired, refund required, fully refunded. Partial refund amounts are separate from fulfilment state. |
| Payment attempt | Creating, pending, captured, failed, cancelled, unknown. Authorization-only is not captured. |
| Refund request | Requested, approved, rejected; distinct from the actual refund operation. |
| Refund operation | Processing, unknown, succeeded, failed. Unknown is not permission for another refund. |
| Subscription | Pending, active, past due, cancellation pending, cancellation scheduled, ended/revoked, failed. |
| Membership access | Derived from a verified paid period and any separately verified access revocation. |
| Dispute | Provider-defined open/response/resolution stages; does not erase the original capture/refund. |
| Job | Pending, leased/running, completed, failed/requires review. |

Only permit a new payment attempt after the previous one is definitively failed/cancelled and the customer deliberately retries under a valid quote. An unresolved attempt must not be bypassed with a new reference. If a provider reports an unexpected additional capture, retain the fact, create an exception and resolve the extra money; a database uniqueness error must not hide it.

### 6.5 Durable jobs and idempotency

Write business state and an outbox/job in the same transaction. Workers lease jobs with database locking, process outside the transaction, and acknowledge only the lease they own. Use retry/backoff, lease renewal or safe expiry, a terminal review state and operator replay.

Financial idempotency must survive crashes, repeated browser requests, duplicate webhooks and overlapping workers. Persist the request fingerprint and resulting operation reference; the same key with a changed payload is a conflict. Network delivery is at least once; design repeated delivery to produce a single intended economic effect.

Provider calls must not run inside a financial SQL transaction that may automatically retry. Lookup ambiguous operations before retrying the same provider mutation. Do not recycle financial references after a short cache expiry.

## 7. Ordered build backlog

**Owners:** Bot implements and verifies; Anas supplies external setup/decisions; Both means a prepared implementation plus an outside action. `E01–E09` are the owner inputs in Section 9. Dependencies control final completion; code preparation can proceed before an external dependency is ready.

Every task starts `not_started`. Each completed task needs a working result, relevant tests and an evidence record. Do not label a mock integration as real because the interface looks correct.

### Phase 00 — Define the build

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P00-01 / Bot | This roadmap | Create product specification and decision log covering free/member pricing, eligible purchases, refund/cancel principles, languages and pilot scope. Use the agreed rules; record genuine open choices without restarting settled discussions. |
| P00-02 / Both | P00-01 | Prepare provider requirements and a capability/funds-flow checklist. Identify required documentation and outside inputs. Completion here is a prepared checklist and tracked request; provider approval itself is E01. |
| P00-03 / Bot | P00-01 | Create architecture, role matrix, domain/schema design, state transition tables and proposed API contract. Define authoritative money/stock/identity sources and adapter boundaries. |
| P00-04 / Bot | P00-03 | Create task status, implementation log, owner setup, release-gate template and test strategy. All unbuilt work remains unbuilt; select dependency-ready tasks and define evidence paths. |

**Gate:** a coding agent can explain the business rules and begin the repository without relying on previous chat or source code.

### Phase 01 — Create the project foundation

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P01-01 / Bot | P00-03, P00-04 | Create the repository/workspaces, Vue shell, Express server, TypeScript contracts, lint/format configuration and locale structure. Root commands start the app and typecheck it. |
| P01-02 / Bot | P01-01 | Add PostgreSQL Compose configuration, migration runner, isolated test database, transaction helper and runtime/migration role design. A fresh database migrates reproducibly; test/reset commands reject unsafe targets. |
| P01-03 / Bot | P01-02 | Implement environment validation, adapter selection, local-only fictional seed and initial fixture profiles/outbox. Local app works without AWS; hosted configuration rejects local/demo adapters. |
| P01-04 / Bot | P01-03 | Add CI, unit/native-database smoke tests, browser smoke test, production build and an actual non-root Docker build/run check. Commit lockfiles and document local setup. |
| P01-05 / Bot | P01-02 | Add structured redacted logging, request IDs, error schema, process health/readiness, graceful shutdown, a base append-only audit table and migration/runtime grants. Health checks expose no secrets; runtime cannot mutate schema or prior audit events. |

**Gate:** another developer can start the new local app and its database from the README, and CI exercises the real database and container.

### Phase 02 — Accounts, sessions and permissions

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P02-01 / Bot | P01-03, P01-05 | Create user/session models and the local identity adapter. Use server sessions with hashed opaque tokens; fictional profiles only on loopback. Demonstrate local customer and staff sessions. |
| P02-02 / Bot | P02-01 | Implement Cognito authorization-code/PKCE integration, state/nonce validation, verified identity claims, refresh/logout and separate admin pool configuration. Test protocol failures locally; actual hosted integration is verified in Phase 10. |
| P02-03 / Bot | P02-02 | Implement permission/tenant guards, CSRF/exact-Origin, Secure/HttpOnly cookie rules, rate limits, staff-role authority and admin assurance. Cross-user/business IDs and customer-pool admin attempts fail. |
| P02-04 / Bot | P02-03 | Build account/profile/session-expiry flows, language preference, authentication UI and protected route states. An expired browser session cannot silently submit a purchase under another identity. |

**Gate:** permissions work on the server and local browser, with Cognito integration code ready for real account testing. Do not call that code alone a verified Cognito deployment.

### Phase 03 — Merchant supply and discovery

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P03-01 / Bot | P02-03 | Build merchant application/review, versioned consent, branches, staff invitations and distinct provider-onboarding status. Only approved businesses can publish/accept new sales; app approval is not KYC approval. |
| P03-02 / Bot | P03-01 | Build products, services, surplus, prices, terms and validated images. Enforce ownership, file type/size/dimensions and re-encoding; private business records never enter public media storage. |
| P03-03 / Bot | P03-02 | Implement allocated stock, versioned updates, movement history and CSV preview/atomic import. Stale input cannot overwrite a concurrent update; available and reserved stock have separate meanings. |
| P03-04 / Bot | P03-03 | Implement offer eligibility, reference-price evidence, approval, scheduling, pickup windows and material-edit reapproval. Invalid/expired/unapproved promotions cannot enter a quote. |
| P03-05 / Bot | P03-04 | Build customer catalogue, category/city/query filters, business/branch profile, offer detail and favourites. Show real stock/terms and free/member price previews, with useful empty/loading/error states. |

**Gate:** a merchant creates allocated stock and an approved promotion; a customer finds and understands it. No payment is implied yet.

### Phase 04 — Money, stock holds and checkout preparation

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P04-01 / Bot | P00-01, P01-01 | Implement the pure pricing/allocation/refund library and financial fixtures. Prove sequential discounts, integer bounds, deterministic ties and exact cumulative refund totals. |
| P04-02 / Bot | P04-01, P03-04 | Implement server quotes, immutable order/line snapshots, native SQL row locking, reservation expiry/release and customer hold limits. Independent concurrent connections cannot reserve the final unit twice. |
| P04-03 / Bot | P04-02 | Implement authenticated cashier bill requests with opaque expiring one-use tokens. The customer verifies merchant/branch/post-public amount; public discount is never applied twice. |
| P04-04 / Bot | P04-02, P01-05 | Implement idempotency persistence, transactional outbox, leased worker, retry/backoff and failed-job review. Crash/retry tests preserve one intended effect and never lose committed financial work. |
| P04-05 / Bot | P04-03, P04-04, P03-05 | Build cart, quote review, expiry, stock-change errors and recovery screens. Display the server's amount and eligibility; payment initiation stays unavailable until the corresponding adapter is ready. |

**Gate:** accurate prices and reservations work under contention. The UI cannot change the charged amount by editing a request.

### Phase 05 — Purchase payments

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P05-01 / Bot | P04-04 | Define a typed payment interface and build a durable local simulator: success, decline, delayed/unknown outcome, duplicate event and refund cases. No real cards or external money. |
| P05-02 / Bot | P05-01, P04-05 | Complete the local purchase journey, hosted-checkout abstraction, return/pending screens and safe refresh/reopen behavior. A simulated capture changes server order state; a browser success parameter does not. |
| P05-03 / Both | P05-01, P00-02, E01, E02 | Implement one selected provider's real checkout/lookup/refund primitives from approved docs. Separate sandbox/live credentials, accounts/hosts and allowlists; staging refuses live provider configuration. |
| P05-04 / Bot | P05-03 | Implement provider-specific webhook authentication, durable scoped deduplication, normalized lookup, polling and late-capture recovery. Unknown outcomes reuse their stable reference; wrong account/currency/amount triggers an exception. |
| P05-05 / Both | P05-04, P05-02 | Connect the customer flow to sandbox and test 3DS/decline, lost return, double click, timeout-after-success, delayed capture and duplicate/out-of-order events. Record real sandbox evidence separately from simulator tests. |

**Gate:** the local app can complete purchases without outside setup; the payment integration portion remains open until the real provider sandbox passes.

### Phase 06 — Paid membership and member value

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P06-01 / Bot | P04-01, P02-04 | Create membership consent, plan, agreement and paid-period models plus local simulator lifecycle. Persist version, displayed ₪15 price and explicit recurring consent; pending checkout grants no paid access. |
| P06-02 / Bot | P06-01, P05-03 | Implement provider recurring agreement, invoice lookup/pagination and verified paid-period import. Unique provider invoice identity prevents duplicate fee/entitlement grants. |
| P06-03 / Bot | P06-02, P05-04 | Implement cancellation, failed renewal/recovery, cancellation races, period boundaries and full/partial fee-refund facts. Separate refunded money from access revocation and preserve already-paid access under the approved policy. |
| P06-04 / Bot | P06-03, P05-02 | Apply real membership eligibility to quotes and finish join/status/cancel/savings UI. Public/member savings and actual fees reconcile after returns. Test end-of-month, leap-year and timezone cases. |

**Gate:** members receive the extra benefit only while entitled, can understand and cancel renewal, and see truthful incremental value.

### Phase 07 — Fulfilment, refunds and finance

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P07-01 / Bot | P05-02 | Build paid-order readiness, merchant-bound single-use pickup code/QR, scanner and fallback. Wrong-merchant scans, guesses, replay and conflicting refund states are blocked. |
| P07-02 / Bot | P07-01, P05-03 | Build customer refund requests, manager/admin review and partial/full provider execution. Bound quantities and totals, reserve unknown refunds and restock at most once after verified success/approved return. |
| P07-03 / Bot | P07-02, P06-03, P05-04 | Ingest provider-dashboard refunds, disputes/chargebacks and reversals. Preserve original money facts; prevent unexamined refund-plus-chargeback double credit and expose deadlines/ownership. |
| P07-04 / Bot | P07-03 | Import settlement statements and fees with pagination/checkpoints/replay. Match per account/currency and create owned exceptions for missing/mismatched lines. Rechecking recent captures alone is insufficient. |
| P07-05 / Both | P07-02, P06-03, E05 | Integrate approved merchant-sale and Perkly-membership receipt/invoice/credit-document flows. Test issuance, access, failures, duplicates and refund references; order summaries are not substituted for tax documents. |
| P07-06 / Bot | P07-04, P07-05, P07-01 | Complete business/admin reports, support cases, reconciliation/job consoles, verified-purchase reviews and moderation/ranking. Reduce repeat/self-purchase manipulation; no arbitrary paid-state override. |

**Gate:** an order can be collected or refunded correctly, and an operator can reconcile what happened to the money.

### Phase 08 — Natural-language discovery

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P08-01 / Bot | P03-01 | Implement branch-level amenity facts, provenance, verification permissions, freshness and correction workflow. A merchant cannot label its own assertion as independently Perkly-verified. |
| P08-02 / Bot | P08-01, P03-05 | Implement typed search intent, deterministic hard filters, location/age clarification and labelled straight-line distance. Ordinary filtering remains useful without a model. |
| P08-03 / Both | P08-02, E07 | Add the approved Bedrock structured-output adapter with strict validation, input/token limits, timeout and privacy boundary. Select actual model/profile/region and scoped IAM; no assumed model availability. |
| P08-04 / Both | P08-03 | Evaluate English/Hebrew/Arabic, negation, unknown/stale facts, impossible requests and model failures. Implement shared quotas and fallback. Record actual paid evaluation quality/latency/cost; no fabricated businesses or violated hard constraints in the acceptance set. |

**Gate:** the family-dinner/play-area search returns justified matches or a useful clarification. A synthetic response is not a real model evaluation.

### Phase 09 — Complete trust, language and operations features

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P09-01 / Both | P07-06, P06-04, P08-02, E06 | Finish all launch-language strings, RTL, local dates/currency, form accessibility and PWA behavior. Review recurring/refund wording with native speakers; offline mode cannot display a false paid confirmation. |
| P09-02 / Bot | P07-06, P06-03, P02-04 | Implement full personal-data export and resumable deletion/anonymization, account disabling, confirmed recurring cancellation, ownership transfer handling and identity cleanup. Retained finance data gets an explicit approved reason. |
| P09-03 / Both | P07-06, E04 | Implement transactional inbox/email templates, SES integration, bounces/complaints, suppression and retry visibility. Verify authorized deliveries; notification duplication cannot duplicate financial operations. |
| P09-04 / Bot | P02-03, P07-04 | Harden secrets, versioned encryption/key migration, token/log redaction, uploads, abuse controls and credential rotation. Test failure/recovery boundaries and document incident/rotation procedures. |
| P09-05 / Both | P09-01, P09-02, P09-03, P09-04, P07-05, E05, E06 | Complete policy, privacy retention, receipt, translation and merchant-content review. Published wording/configuration matches the code; no unfinished legal/translation placeholder remains in purchase flows. |

**Gate:** the app's data and customer promises are operable throughout purchase, cancellation, refund and account closure.

### Phase 10 — AWS staging and release infrastructure

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P10-01 / Both | P00-03, P01-04, E03 | Create CDK for staging/production, private networking, RDS, API/worker, HTTPS/WAF, media, pools, secrets and logs. Review current regional availability, capacity and cost; services start stopped until setup is complete. |
| P10-02 / Both | P10-01, P01-04, E09 | Build protected release CI with native tests, actual image scanning/build, immutable ECR digest and repository/environment-scoped OIDC roles. Prepare reviewable migrations/deployments without static AWS keys. |
| P10-03 / Both | P10-02, P02-02, P09-03 | Deploy authorized staging foundation, bootstrap separate DB roles/keys, migrate and start real Cognito/RDS/media/email integration. Verify HTTPS, callback/refresh/recovery/admin MFA and runtime grants; payments initially disabled. |
| P10-04 / Both | P10-03, P05-05, P06-04, P07-06, P08-04 | Exercise full hosted sandbox lifecycle with correct provider/model/environment identities. Test browser checkout return, renewal/refund feeds, uploads, notifications and privacy/account closure using test identities. Keep demo routes unavailable. |
| P10-05 / Both | P10-04, P09-04, E08 | Connect real alert recipients and rehearse worker/provider outage, bad release, isolated database restore and key/credential recovery. Record actual recovery point/time and prove finance replay safety. |

**Gate:** staging is a real service with measured recovery and operating evidence. Infrastructure synthesis alone cannot pass.

### Phase 11 — Qualification and controlled launch

| ID / owner | Depends on | Deliverable and acceptance |
| --- | --- | --- |
| P11-01 / Bot | P10-04, P09-05 | Run automated financial/security/concurrency acceptance on native PostgreSQL with multiple workers/connections, then measured load/soak tests. Record coverage of AT01–AT33; physical/recovery reviews complete in P11-02. AT34 is reserved for P11-03/P11-04. |
| P11-02 / Both | P11-01, P10-05, E08 | Complete independent security review, real iPhone/Android/desktop/QR/accessibility acceptance and the release evidence packet. Record digest, migrations, configuration, known issues and rollback/incident ownership. |
| P11-03 / Both | P11-02, E02 | Deploy the qualified production configuration and perform owner-authorized small live sale/membership charges, partial/full refunds and cancellation. Verify actual merchant settlement, fees and documents. No unrestricted public acquisition yet. |
| P11-04 / Both | P11-03 | Run a proposed 3–5-merchant, 50–100-invited-adult pilot sized to support capacity. Reconcile daily; observe at least one full eligible membership renewal cycle plus recovery window. |
| P11-05 / Both | P11-04 | Review customer savings/renewals, merchant fulfilment, contribution and actual operating costs. Decide launch, iterate or hold; close critical/security/money issues and authorize a bounded public rollout. |

**Gate:** a specific release has real financial, operational and business evidence. Do not call the project complete solely because the pages load or automated tests pass.

## 8. API, payment and AI boundaries

### 8.1 Proposed public API

Use `/api/v1` as the initial application prefix. Validate every input and response schema; publish an OpenAPI contract from the real implemented schemas. These are route families to implement, not provider endpoints.

| Flow | Proposed routes | Important contract |
| --- | --- | --- |
| Session | `GET /session`, `POST /auth/logout`; separate hosted login/callback routes | Current identity, capabilities and CSRF token; no reusable provider secrets in the browser. |
| Discovery | `GET /businesses`, `GET /businesses/:id`, `GET /branches/:id` | Bounded pagination/filter/sort, approved public data and honest price/availability. |
| Intent search | `POST /search/intent` | Query, UI locale and optional location/ages; validated filters, matches, clarification or recoverable failure. |
| Quote | `POST /quotes` | Catalogue branch/product quantities **or** a bill-request token. Response includes server totals, expiry and immutable order identity. |
| Bill | `POST /businesses/:id/bills`, `GET /bills/:token` | Staff creates post-public amount/expiry; customer reads only necessary payment context. |
| Payment | `POST /orders/:id/payments`, `GET /orders/:id` | Stable action key, current attempt/status, approved hosted URL when available. Redirect query parameters never set payment state. |
| Fulfilment | `POST /orders/:id/ready`, `POST /pickups/redeem` | Correct staff/branch, paid state, single-use token and no conflicting refund. |
| Refund | `POST /orders/:id/refund-requests`, `POST /refund-requests/:id/review` | Original line quantities/reason; reviewer authority and explicit restock intent; money status remains separate. |
| Membership | `GET/POST /membership`, `POST /membership/cancellation`, `GET /savings` | Explicit current price/terms consent, confirmed paid-through date, renewal/cancel state and correctly scoped savings. |
| Merchant | Business-scoped branches, staff, catalogue, offers, stock, CSV and reports | Every operation checks server-side ownership and role scope; optimistic versions for stock edits. |
| Personal | Account/profile, notifications, favourites, support, export and deletion requests | Own data only, resumable sensitive workflows, clear status and privacy boundary. |
| Admin | Approval, jobs, exceptions, disputes, support, privacy, moderation and reports | Separate admin assurance and audited actions; no client-supplied privileged role. |
| Provider events | `POST /webhooks/payments/:provider` | Registered provider only; raw-body authentication as specified by its approved docs, durable deduplication and subsequent verification. |

Use structured errors with stable code, request ID and optional field errors. Use `Idempotency-Key` for financial creation/review operations, scope it to actor/action, and return a conflict for a changed payload. Keep the same key across retries of one customer action.

Browser mutations require a session, exact allowed Origin and CSRF protection. Hosted session cookies are Secure/HttpOnly with a deliberate SameSite/scope policy. Validate user identity and permissions on the server; do not use localStorage flags to grant membership or admin access.

Bound request bodies, queries, uploads, pagination and export sizes. Escape spreadsheet formula injection in CSVs. Define timeouts and retry behavior so a web client never automatically creates a new financial attempt after an ambiguous response.

### 8.2 Payment adapter contract

Create a typed internal interface with operations equivalent to:

```text
createCheckout(stableReference, approvedSellerAccount, amountAgorot, ILS, returnUrl)
getCheckout(stableReference)
createRefund(stableReference, originalPaymentId, sellerAccount, amountAgorot)
getRefund(stableReference)
createMembershipAgreement(stableReference, customerRef, PerklyAccount, 1500, consent)
getMembershipAgreement(stableReference)
cancelRenewal(stableReference)
listVerifiedMembershipInvoices(cursor)
listExternalFinancialEvents(cursor)
listSettlementStatements(cursor)
verifyAndNormalizeWebhook(rawBody, approvedHeaders)
```

These are internal capabilities, not claims that any provider offers endpoints with these names. Implement them through the selected provider's real documented API/SDK and permitted reports. Use a direct integration module in the worker/backend initially; do not create another deployed bridge service without a concrete need.

Required semantics:

- Stable provider references and idempotency must survive concurrent calls and crashes. A conflicting amount/account under the same reference fails.
- Server lookup verifies provider ID, reference, account, amount, currency and captured status. Refunds additionally match the original payment.
- A temporary lookup miss must not trigger duplicate creation when the provider is eventually consistent. The provider-selection gate must resolve this limitation.
- Authenticate provider callbacks according to that provider, durably acknowledge valid events and process them asynchronously. Acknowledgement is not financial completion.
- Deduplicate by provider/environment/account/event identity, with payload conflict detection and bounded retention appropriate to replay risk. Poll/backfill events missed during downtime.
- Use HTTPS, explicit host allowlists, server-side secrets, timeouts and controlled retries. Never accept an arbitrary browser-supplied provider URL or account reference.
- Keep raw card numbers/CVV out of Perkly. Implement the provider's approved hosted flow and security checklist; an offsite form is not by itself a compliance certificate.
- Preserve unknown outcomes. A refund or recurring cancellation timeout remains a tracked operation with an owner, not an excuse to forget it.
- Use separate switches for accepting new purchases/subscriptions and continuing verification/refunds/cancellations/reconciliation. Recovery must work during a sales pause.

### 8.3 Bedrock search contract

The model interprets language into a strict schema. Database-backed code applies hard constraints and ranks eligible matches. Do not give the model authority to create businesses, invent coordinates, grant benefits, execute payments or change the database.

Initial supported intent: restaurant/café, meal, family suitability, play area on-site/nearby, indoor/outdoor play, supervision, children's age suitability and geographic radius. Use branch-specific facts with provenance and a proposed 90-day maximum freshness window. Unknown does not mean yes; stale safety-related claims cannot satisfy a hard requirement.

Ask for missing age/location information. Support permitted GPS and a curated, verified area selector; a free-text city geocoder is a separate integration. Label straight-line distance clearly, without presenting it as driving time. Do not collect children's names for this use case.

Budget, cuisine, opening-now, reservation availability, accessibility and dietary/allergy guarantees remain unsupported until the corresponding data and validation rules exist. Clarify an unsupported hard requirement rather than silently dropping it. Merchant play-area/supervision claims are not safety certification.

Send only the needed query text and UI language to the model. Keep merchant data, precise coordinates, identity and financial details out of model input unless a later reviewed design specifically requires them. The user's query itself can contain personal information; disclose external processing and avoid logging raw queries.

Use strict schema/semantic validation, timeouts, input/token limits, shared per-user/daily quotas and a concurrency bound. Evaluate initial schema compilation/warm-up and fallback behavior. Ordinary discovery must continue if AI is unavailable. Choose a structured-output-compatible model/profile and region from current account availability, not a guessed model ID.

## 9. External setup owned by Anas

The bot creates `docs/OWNER_SETUP.md` with these items, current state, exact instructions and only the non-secret values it needs. It must keep implementing unrelated tasks while an item is pending. An item may be delivered in stages: for example, sandbox access before live approval.

| ID | You provide/setup | Ready when |
| --- | --- | --- |
| E01 | Payment provider and approved funds flow | Provider confirms merchant settlement, Perkly recurring collection, roles/fees, refunds/disputes/statements, reference/idempotency semantics and approved API documentation. |
| E02 | Provider sandbox, then live onboarding | Sandbox credentials and test seller accounts are stored securely for Phase 05; live merchant/Perkly accounts and controlled financial-test authorization are available for Phase 11. |
| E03 | AWS account(s), region, domain and cost approval | MFA/recovery contacts, SSO/deploy access, selected environment/account isolation, domain/DNS control, regional certificate and reviewed spend estimate. |
| E04 | Email/support | Sending domain/DNS verification, SES access and limits, Cognito email setup, monitored support mailbox and delivery-event routing. |
| E05 | Legal/accounting decisions | Approved merchant/consumer terms, recurring/cancellation/refund policies, privacy/retention, taxes/document issuer, reference-price practice and accessibility obligations. |
| E06 | Native-language review and merchant material | Reviewed Hebrew/Arabic wording, real merchant identity/photos/rights, genuine prices, stock allocations, pickup terms and branch facts. |
| E07 | Bedrock activation and permitted processing | Approved model/profile/region, account access, scoped resources and authorization for paid evaluation. |
| E08 | Operating/review/release ownership | Real alarm recipients, support coverage, independent security reviewer, incident escalation and approval of the exact live test/rollout. |
| E09 | Repository/CI | Chosen repository, protected branches/environments, authorized deploy identity and release/evidence retention. |

The first provider decision should begin early because an incompatible settlement or recurring model can change the build. No account setup is needed to implement the local simulator and ordinary discovery.

Do not give a bot AWS keys, payment secrets, card details or merchant KYC files in chat. Store secrets through approved local/account tools and Secrets Manager; provide references and public/approved documentation. These setup items do not require the bot to impersonate you or accept commercial terms on your behalf.

## 10. Required verification

Use unit tests for exact pure rules, native PostgreSQL integration tests for transactions and access, contract tests for adapters, and browser/device checks for complete workflows. Use disposable isolated databases; no reset command may target existing staging/production data.

| ID | Scenario | Pass condition |
| --- | --- | --- |
| AT01 | Free/member price with no public offer and 3/10/20% offers | Matches Section 2 and exact server algorithm. |
| AT02 | Multiple lines, tiny amounts, rounding and large inputs | Allocations sum exactly; invalid bounds rejected; no overflow or float drift. |
| AT03 | Partial quantity return in different sequences | Total refund never exceeds the capture and full return sums exactly to it. |
| AT04 | Independent buyers contend for the last stock unit | At most one valid reservation and no negative balance. |
| AT05 | CSV/edit races with new holds/capture/expiry | Version and locking rules prevent lost stock updates or double release. |
| AT06 | Capture arrives after offer/hold/member expiry | Original quote policy enforced; all stock recovered safely or one compensating refund. |
| AT07 | Edited amount/account/merchant/member flag | Server rejects tampering and uses its approved quote/account. |
| AT08 | Repeated pay click, refresh, changed idempotency payload | Same action produces one operation; changed payload conflicts. |
| AT09 | Worker dies after provider accepts charge/refund | Restart recovers the same operation and one journal effect. |
| AT10 | Old worker continues after lease expiry | Overlapping workers cannot duplicate economic effects. |
| AT11 | Invalid/replayed/duplicate/lost/out-of-order webhook | Authentication and durable deduplication hold; polling recovers misses; capture is not downgraded. |
| AT12 | Failed 3DS, browser success parameter, unknown lookup | No unverified paid state; unknown does not start a new reference. |
| AT13 | Staging given live credentials/hosts/account | Startup or financial operation is rejected by server environment controls. |
| AT14 | Recurring invoice duplicated or merely marked active/unpaid | Only verified paid invoices grant access and fees are recorded once. |
| AT15 | Renewal fails, later recovers; cancellation races creation/renewal | No unearned period or duplicate agreement; customer state matches provider. |
| AT16 | End-of-month, leap year, timezone/DST and fee refunds | Confirmed periods respected; cancellation, fee refund and access revocation stay distinct. |
| AT17 | Wrong merchant, QR guessing/replay, pickup/refund race | Correct single-use fulfilment with rate limits and transactional conflict handling. |
| AT18 | Duplicate/concurrent partial/full refunds or timeout | Capture/quantity bounds hold; unknown refund remains reserved; stock restored at most once. |
| AT19 | Provider-dashboard refund, chargeback or reversal | Imported once, correct money facts/exception and no unexamined double credit. |
| AT20 | Fees/reserves/refunds/payouts/receipt failures | Statements reconcile or exceptions get owners; correct document issuance and access. |
| AT21 | Cross-user/business request or unauthorized cashier action | Denied on reads, mutations and exports with no private-data leak. |
| AT22 | Customer token at admin route, invalid OAuth/CSRF/session | No privilege/session bypass; admin requires the correct pool/assurance and grant. |
| AT23 | Account closure with active subscription/order/refund | Verified cancellation, obligation handling, scoped export and actual approved erasure/retention. |
| AT24 | Oversized/fake image, malicious text/CSV and invitation theft | Validation, re-encoding, output/CSV safety and identity binding hold. |
| AT25 | AI missing/stale facts, negation, unsupported need, ages/location missing | No false hard-constraint match; precise clarification or empty result. |
| AT26 | Real Bedrock timeout/throttle/cold schema/invalid output and replica quota | Safe fallback, shared quotas and recorded quality/latency/cost; no raw-query logs. |
| AT27 | Offline/reopened PWA, camera denied, abandoned checkout | Server truth recovered; offline cannot show a usable paid confirmation. |
| AT28 | English/Hebrew/Arabic, keyboard, screen reader and physical mobile | Critical flows understandable and operable; amounts/consent readable in RTL. |
| AT29 | SES bounce/complaint or crash after acceptance | Suppression/delivery visible; duplicate email cannot duplicate money movement. |
| AT30 | Restore with pending jobs and encrypted refresh/pickup fields | Key access and balances verified; drill cannot charge real money; provider-event recovery planned/tested. |
| AT31 | Bad release, mixed API/worker versions and secret/key rotation | Compatible recovery with no lost financial history or unreadable ciphertext. |
| AT32 | Provider/worker/database outage and pause-new-sales control | New charges stop when required; recoveries remain possible and alerts reach an owner. |
| AT33 | Measured sustained/burst load across multiple connections/workers | Meets agreed targets or explicitly reduces admitted pilot capacity; no broken money/stock invariants. |
| AT34 | Controlled live charge, partial/full refund, membership renewal and bank settlement | Actual provider, bank, document and application records agree; no unexplained money discrepancy. |

Do not substitute line-coverage percentages or large numbers of superficial tests for these checks. Save command/environment/build identifiers and sanitized results. Record what did not run and why.

### Proposed initial operating targets

These are targets to validate, not measured capabilities or guarantees:

- Load rehearsal: 100 concurrent browsing sessions, 10 checkouts/minute and a deliberate last-unit burst, with stated test duration and dataset.
- App-owned browse/quote p95 below 500 ms at that load; report external provider/AI latency separately.
- Proposed monthly availability objective: 99.9% for app-owned core endpoints, with exclusions and provider outages reported clearly.
- Proposed database recovery objective: RPO up to five minutes and RTO up to two hours for the tested incident class; prove with restore/cutover exercises.
- Financial correctness: no unexplained discrepancy. Pending/unknown operations remain visible with age, owner and resolution state.

Budget database connections across maximum API replicas, workers, migrations and administration. Tune queries, indexes, pagination, pool limits and queue behavior from measurements before adding architectural components.

## 11. AWS design and deployment

### 11.1 Infrastructure to create

Use separate staging/production accounts where practical, otherwise document and enforce environment isolation. Proposed application region: `il-central-1`; verify exact service, database version and Bedrock/model availability before deployment. The AI processing region may differ only after explicit owner/data-processing review.

- Two-AZ VPC: public HTTPS ALB, private API/worker subnets, isolated database subnets. No public database or public application-task address.
- Regional ACM certificate for each app hostname, DNS to the ALB, HTTP-to-HTTPS redirect and appropriately tested WAF rules.
- API service serving the compiled Vue application and API; separate worker service; non-root containers from one immutable image. Production starts with two API tasks across availability zones and a separately monitored worker.
- Private encrypted RDS PostgreSQL with verified TLS, separate runtime/migration/owner roles, production Multi-AZ, deletion protection and a proposed 14-day automatic backup window. Review actual backup policy with the owner.
- Private S3 merchant-media bucket, validated images and CloudFront OAC access. Keep private uploads/records out of the public media path.
- Separate customer/admin Cognito pools, admin MFA, verified-email and recovery configuration, narrowly scoped OAuth callback URLs.
- Secrets Manager and task roles. API/worker must not receive database-owner credentials; bootstrap/migration jobs use restricted one-off roles.
- CloudWatch logs/metrics, actionable alarms, confirmed recipients, cost budgets and account audit/security controls under the owner's policy.

Review NAT, ALB/WAF, database, backup and networking costs explicitly. Resources may incur charges while application tasks are stopped. Budget notifications are not a guaranteed spending cap.

### 11.2 Configuration contract to implement

| Proposed setting | Required behavior |
| --- | --- |
| `APP_MODE` | Local, staging or production; hosted modes enforce HTTPS and real identity. |
| `AUTH_PROVIDER` | Local adapter allowed only on loopback local mode; otherwise Cognito. |
| `DATABASE_URL` / TLS settings | Runtime credentials only in normal tasks; strict certificate validation for hosted DB. |
| `APP_ORIGIN` | Exact public origin for cookies/callbacks/CSRF; reject arbitrary Origin values. |
| `PAYMENT_PROVIDER` / `PAYMENT_ENV` | Disabled or chosen adapter; explicit sandbox/live identity. Staging can never make live charges. |
| New purchase/member gates | Independently pause new sales and new membership agreements while verification/refunds/cancellation/reconciliation continue. |
| `SEARCH_PROVIDER` | Fixtures local only; Bedrock or ordinary filters when hosted. |
| `EMAIL_PROVIDER` | Outbox locally; approved SES identity for production transactional delivery. |
| Encryption key ring | Versioned key IDs, active encryption key and controlled old-key reads/migration. Secure backup/recovery required. |
| Policy versions/URLs | Real approved customer/merchant/privacy terms and monitored support contact before live usage. |

Keep secrets out of source, CDK context, browser assets and logs. Use environment-specific non-secret configuration with documented defaults and startup validation. Secret changes injected into tasks require a controlled task replacement; key rotation requires migration, not just changing a string.

### 11.3 Initial deployment order

1. Finish the infrastructure code, CI and reviewable cost/security change set. Anas configures account access, domain and certificate.
2. Deploy the authorized foundation with application services stopped and payment acceptance off.
3. Build once, scan, push an immutable image to ECR and record its digest. Use that artifact for bootstrap/migration/API/worker tasks.
4. Run one-time private bootstrap: create runtime/migration roles and application encryption key material securely. Make interrupted bootstrap recoverable without overwriting an existing key or generating mismatched credentials.
5. Run versioned migrations under the migration role. Verify runtime grants and immutable-history restrictions.
6. Start staging with real Cognito, verified DB TLS and payment integration disabled; verify DNS/HTTPS, readiness and ordinary browsing.
7. Enrol the first administrator through the separate identity pool plus restricted database provisioning. A browser must never self-grant admin.
8. Activate authorized test email/media, provider sandbox and Bedrock evaluation. Exercise the full application and actual callbacks.
9. Test alarms, worker crashes, provider outages, bad releases, key rotation and isolated restore. Save evidence against the exact image/configuration.
10. Prepare production separately, promote the qualified artifact and perform the authorized restricted live test. Public acquisition remains a separate release decision.

### 11.4 Routine releases and recovery

Use protected branches and temporary OIDC deployment credentials. Review migrations for expand/contract compatibility with old/new API and worker instances. Back up before material production migrations; run migrations through a one-off task, not every API startup.

Promote the same tested artifact. Record commit, image digest, configuration version, migrations, approval, evidence and rollback instructions. Roll back only to a compatible application version; do not delete financial history or execute destructive down-migrations as a shortcut.

Enable ECS deployment failure detection/rollback and test its behavior, including the first deployment when no known-good predecessor exists. Restore a database into an isolated environment with live payment/email disabled, verify encrypted fields and financial totals, then rehearse safe configuration cutover and provider-event recovery. A backup checkbox is not proof of a successful recovery.

The starting design is single-region and does not promise automatic regional-disaster failover. Add separate-account/region backups or recovery infrastructure only with a documented business requirement, budget and tested procedure.

## 12. Operating and business readiness

### 12.1 Minimum operating view

Show API errors/latency/readiness, DB connections/storage/locks, worker heartbeat/oldest job/failed jobs, aged pending or unknown money operations, reconciliation differences, cancellation/renewal failures, email delivery/suppression and AI usage/cost. Alert a responsible person; an alarm with no confirmed recipient is unfinished.

Maintain runbooks for unknown payment, stuck refund, provider outage, worker backlog, merchant suspension, bad release, database restore, compromised credentials and privacy requests. Each needs a first safe action, owner, investigation identifiers, recovery steps and criteria for reopening sales.

During the pilot, reconcile finances and check support/fulfilment issues daily. Review costs, renewals, merchant participation, abuse and stale facts weekly. Repeat recovery/rotation exercises on an agreed schedule and after material changes.

Use approved retention rules for each data type. Operational logs, user profiles, support conversations, tax documents and immutable financial history have different purposes. Include data in Cognito, S3, backups and the provider in the data map; a UI deletion flag is not an erasure process.

### 12.2 Business measurements

The launch revenue model is membership, with merchant-funded discounts. Record actual subscription billings, refunds, applicable tax treatment, provider fees, support/AI/email usage and fixed infrastructure/operating costs. Include free users' costs. Merchant gross sales volume is not Perkly revenue.

Useful formulas:

- Gross membership billings = confirmed member charges × ₪15, with refunds separately visible.
- Average contribution per paid member = revenue after applicable tax/refund treatment minus allocated variable costs.
- Break-even paid members = ceiling of fixed monthly cost divided by positive contribution per member.
- Member net value = actual extra savings minus paid membership fees, adjusted for verified purchase/fee refunds.

Illustration only: ₪4,000 fixed monthly cost divided by ₪12 contribution requires 334 members. Neither input is a quote or forecast. Replace all assumptions with the actual provider agreement, current AWS estimate and measured pilot costs.

Track first purchase, membership conversion, eligible spending, median extra savings, members who recovered their fee, renewal among users actually due, merchant repeat participation, collection/refund failure rate, support time and acquisition cost. A small pilot can expose problems without proving large-scale demand.

Wait for at least one full eligible renewal cycle plus the agreed recovery window before reporting retention. Code completion and a successful live charge do not demonstrate product-market fit.

## 13. Launch gates

All items below require recorded evidence for the new build. None is complete on the basis of this roadmap alone.

- [ ] The new repository runs locally from its README without AWS or old Perkly source.
- [ ] Native database, container, unit, integration, contract and key browser checks pass for the release.
- [ ] The complete pricing, reservation, replay, refund and membership test matrix passes under relevant concurrency/failure conditions.
- [ ] The provider approves the funds-flow model and each live merchant/Perkly account.
- [ ] Sandbox/live isolation and pause-new-sales controls have negative and recovery tests.
- [ ] Real purchase/refund/member/cancellation/receipt/settlement flows are verified, including external provider events.
- [ ] Customer, merchant and admin launch flows are usable in English, Hebrew and Arabic; RTL, camera denial, offline/recovery and accessibility have evidence.
- [ ] Cognito signup/recovery/refresh/logout, disabled users, server permissions and admin MFA work in hosted environments.
- [ ] Bedrock matching has real evaluation evidence, provenance and safe fallback. A filters-only pilot requires an explicit owner scope decision; it is not completion of the full AI feature.
- [ ] Support, export, actual approved erasure/retention, notification suppression and recurring cancellation can be operated.
- [ ] Security review has no unresolved critical issue; material findings have a documented release decision and controls.
- [ ] HTTPS/private networking, runtime grants, secrets, backup/restore, rotation, alerts and rollback have been exercised.
- [ ] Legal/accounting/merchant/translation inputs and final policy versions are approved for the actual release.
- [ ] Current costs, operating ownership and support coverage are documented.
- [ ] No unexplained financial discrepancy remains; the pilot gives usable customer/merchant value and renewal observations.
- [ ] The owner approves the specific digest, configuration, rollout scope and recovery plan.

“Production-ready” describes a tested version and operating arrangement. It is not guaranteed by a framework, code generator, build command or one successful demonstration.

## 14. How the bot tracks progress

Create these files in Phase 00; they do not exist yet in a fresh repository:

| File | Required content |
| --- | --- |
| `docs/PRODUCT_SPEC.md` | Scope, pricing, user promises, workflows and explicit exclusions. |
| `docs/ARCHITECTURE.md` | Component responsibilities, data ownership and integration boundaries. |
| `docs/DECISIONS.md` | Decisions, rationale, owner and effect on requirements. |
| `docs/TASK_STATUS.json` | Every Section 7 task ID, status, dependencies, evidence and blocker. |
| `docs/IMPLEMENTATION_LOG.md` | Dated work, changed behavior, commands/results, unresolved issues and next step. |
| `docs/OWNER_SETUP.md` | E01–E09, exact external steps, non-secret inputs and readiness. |
| `docs/API.md` and API schema | Actual implemented routes, inputs/outputs/errors and versioning. |
| `docs/PAYMENT_CONTRACT.md` | Provider capabilities, normalized states, idempotency and funds flow. |
| `docs/RELEASE_GATES.md` | Checklist with evidence links for this build. |
| `docs/runbooks/`, `docs/evidence/`, `docs/releases/` | Operating instructions, sanitized results and versioned release manifests. |

Example task-record format:

```json
{
  "roadmapVersion": "1.0",
  "projectOrigin": "empty_repository",
  "tasks": [
    {
      "id": "P00-01",
      "status": "not_started",
      "dependsOn": [],
      "owner": "bot",
      "evidence": [],
      "blocker": null,
      "nextAction": "Create the product specification from the agreed rules."
    }
  ]
}
```

Populate the whole backlog, not just this example. Statuses: `not_started`, `in_progress`, `blocked_external`, `blocked_environment`, `done`, `deferred_by_owner`. Deferral changes the declared release scope; it is not a passing test.

After each useful slice, report:

```text
Completed: task IDs and observable behavior
Verified: commands/checks actually run and results
Open: defects and unverified requirements
Needed from Anas: only the external input blocking a relevant task
Next: the next unblocked task and its acceptance check
Release state: local / staging / qualified live test / pilot / public
```

On “continue,” read the roadmap, repository instructions, task status and decisions, inspect the working tree and resume. Preserve user edits. Keep tests meaningful; do not remove failure cases or weaken guards just to pass. If context/time runs out, write a precise checkpoint rather than falsely marking work complete.

You can prepare more than one task in a phase, but a task is done only when its required behavior, relevant failure paths, schema/configuration/docs and evidence agree. Record blockers precisely and continue independent work without asking the owner to reconfirm routine code changes.

## 15. Later expansion and references

### 15.1 Expansion after the pilot

| Candidate | Prerequisite |
| --- | --- |
| Native iOS/Android | Demonstrated need, native UX/device testing, secure auth/payment returns and current store billing/policy review. |
| POS integration | Select one actual POS, define authoritative stock, SKU/branch mapping, event authentication, replay, drift reconciliation and offline behavior. |
| Appointment scheduling | Resources/capacity, slot holds, timezones, conflict handling and cancellation/no-show/refund policy. |
| Advertising/sponsorship | Revenue and retention experiment, clear labels and required privacy controls. Do not obstruct checkout, cancellation, refund or pickup-code access. |
| Merchant paid tools | Demonstrated willingness to pay for optional analytics/automation; explicit commercial terms. |
| Prize draws | Separate owner decision, current legal/provider review and auditable eligibility/draw operations. |
| Wallet/financing | Separate business/legal/provider architecture; do not add platform custody or lending as a routine feature. |

### 15.2 Official references

The following primary references were checked on 20 October 2026. Architecture and product choices in this roadmap are project recommendations; they are not assurances from these sources.

- [Node.js release schedule and supported LTS versions](https://nodejs.org/en/about/previous-releases).
- [Vue official project setup](https://vuejs.org/guide/quick-start).
- [Cognito authorization endpoint and authorization-code/PKCE parameters](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html).
- [Bedrock structured outputs and supported schema/model considerations](https://docs.aws.amazon.com/bedrock/latest/userguide/structured-output.html).
- [PostgreSQL explicit locking and concurrency controls](https://www.postgresql.org/docs/current/explicit-locking.html); use the documentation for the deployed major version during implementation.
- [RDS point-in-time recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html).
- [ECS deployment failure detection and rollback](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html).
- [GitHub OIDC deployment authentication with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

The bot must verify current provider documentation, regional AWS support/pricing and any applicable platform requirements at the integration/release step. Do not guess them from this roadmap or treat an old version number as permanently correct.

**First action:** give the bot this file in a new folder and paste Section 1. It begins at **P00-01**. In parallel, start **E01**, the provider selection and funds-flow confirmation. No old source ZIP is needed.



