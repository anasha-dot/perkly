# Perkly architecture

**Status:** Design, plus the P01-01 scaffold. The web app, API, and idle worker exist and run locally. No database connection and no cloud resource exist.
**Date:** 20 October 2026.
**Source:** `Perkly_From_Scratch_Roadmap.md` version 1.0, sections 4 through 8 and 11.
**Product rules:** `PRODUCT_SPEC.md`. D-22: Perkly does not charge a merchant product sale. PayPlus is the ₪15 membership provider only. There is no merchant PayPlus terminal. Open: public-offer maximum, PostgreSQL major, discount-code mechanics (O-15), and membership E01.

The paths below exist as the P01-01 scaffold. Behavior past the shell, including the database, is a later task.

## 1. Shape

One repository holds a Vue web app, an Express API, and a worker. The API and the worker ship as one release artifact. PostgreSQL is the only database and is the source of truth for money, inventory, and jobs.

The modular monolith is divided by code packages, not by network services. Do not add Kubernetes, a second database, microservices, Redis, or a vector database unless a later measurement shows a concrete need and a new decision says so.

Hosted deployment, when it is eventually authorized, is the roadmap's AWS design: ECS Fargate for the API and the worker, an application load balancer, RDS PostgreSQL, Cognito, S3 with CloudFront origin access control for public merchant images, SES, Secrets Manager, CloudWatch, and AWS CDK. Proposed region `il-central-1` is not validated (O-12). Nothing in that list is provisioned.

Local development must run without an AWS account: native PostgreSQL, a loopback-only identity adapter, a payment simulator, an email outbox, and search fixtures.

## 2. Components

| Proposed path | Responsibility | Exists |
| --- | --- | --- |
| `apps/web/` | Vue 3, TypeScript, Vite, Vue Router, locale messages, accessible forms, PWA assets | Scaffold. Home screen and `en` / `he` / `ar`. No PWA yet. |
| `apps/api/` | Express HTTP, input validation, session handling, composition of modules | Scaffold. `GET /api/v1` only. |
| `apps/worker/` | Outbox jobs, provider recovery, notifications, reconciliation | Scaffold. Process starts and stays idle. No queue. |
| `packages/domain/` | Pricing, permissions, order, refund, and membership rules. No network calls | Scaffold. No pricing rules yet. |
| `packages/contracts/` | Shared schemas and API DTOs. OpenAPI is published from implemented schemas, which do not exist yet | Locale codes and the shell descriptor. No OpenAPI file. |
| `packages/database/` | Connections, repositories, transactions, numbered migrations, runtime grants | Local migration runner, transaction helper, and role split. No product tables yet. |
| `packages/integrations/` | Adapters for payment, identity, email, object storage, and search/AI | Scaffold. No provider client. |
| `packages/search/` | Intent schema, fact matching, straight-line distance, evaluation fixtures | Scaffold. No search. |
| `infra/` | CDK stacks and environment context, when E03 authorizes them | Local Compose only. No CDK stack. |
| `scripts/` | Setup, migrate, seed, check, and release tooling | `db:migrate` and `db:reset:test` run against loopback. Seed writes fictional local rows only. |
| `tests/` | Unit, integration, concurrency, contract, and browser tests | Locale unit tests, target guards, and one disposable-database migration test. |
| `docs/` | This design set, task tracking, and future evidence | Phase 00 files, with P01-01 and P01-02 status recorded. |

In local development the web server proxies API calls so the browser sees one origin. In hosting, the compiled Vue app and the API are served from the same HTTPS origin. That keeps session cookies, callbacks, and CSRF on one site. CloudFront is for merchant images, not for sitting in front of the authenticated application, in the initial design.

Root scripts exist. `db:migrate` applies numbered SQL on loopback database `perkly` or `perkly_test`. `db:reset:test` and `test:integration` accept only loopback `perkly_test`. `db:seed:local` accepts only loopback `perkly` and writes fictional profiles, search fixtures, and one unsent outbox row. All of those commands refuse a hosted host, a hosted `APP_MODE`, and any other database name. `test:e2e` is a browser smoke test of the home screen. `test:smoke:database` migrates the disposable database.

### Local database roles

| Role | Local use | What it must not do |
| --- | --- | --- |
| `perkly_bootstrap` | Compose superuser. Creates the two databases and the other two roles. | Not an application role. Not used by the API or worker. Hosted bootstrap is a later task. |
| `perkly_migrate` | Owns `perkly` and `perkly_test`. Applies numbered migrations and writes `perkly_meta.schema_migrations`. | Not a superuser. No createdb and no createrole. |
| `perkly_runtime` | Connects and reads what a migration grants. Today that is `SELECT` on `app.schema_info`. | No DDL, no write to `schema_info`, and no access to `perkly_meta`. The audit-table grants are P01-05. |

Local passwords are non-production and are valid only on loopback. PostgreSQL 17 is the Compose image proposal. O-03 stays open.

## 3. Role matrix

The server enforces this on every route, export, and background action. An actor may hold several roles. Roles do not cross businesses. Client storage cannot grant membership or admin.

| Capability | Customer | Cashier | Manager | Business owner | Administrator |
| --- | --- | --- | --- | --- | --- |
| Personal orders and member account | Own | Own personal account | Own personal account | Own personal account | Own personal account |
| Business fulfilment | No | Assigned business and branch | Assigned scope | Owned business | Audited operational workflow. A cashier bill that Perkly charges is deferred. |
| Inventory, catalogue, and offers | No | No by default | Assigned scope | Owned business | Moderation and correction workflow |
| Approve a merchant-sale refund through Perkly | Deferred | Deferred | Deferred | Deferred | Deferred. Do not build it. |
| Business reports | Own receipts only | No | Explicit approved report scope | Owned business | Audited operational scope |
| Invite staff, change owner, change provider details | No | No | No by default | Restricted owner workflow | Restricted provisioning workflow |
| Approve merchants and offers, retry jobs | No | No | No | No | Yes |
| Grant admin rights | No | No | No | No | Restricted separate provisioning process |

Sensitive identity and provider changes require reauthentication and, once a provider exists, that provider's approved controls.

Admin screens do not offer arbitrary mark-as-paid, unverified entitlement grants, or deletion of financial history.

Customer, merchant, and admin screens are listed in `PRODUCT_SPEC.md` section 13. They are requirements for later phases, not pages that exist now.

## 4. Authoritative sources

| Concern | Authority | What is not authority |
| --- | --- | --- |
| Identity of a person | Hosted: verified Cognito claims for the customer pool or the separate admin pool, then a Perkly user row. Local: fictional profiles served only on loopback. | A browser flag, a local password store, or the admin pool implied by a customer token. |
| Application roles and business scope | Rows in PostgreSQL tying a user to a business, branch, and role. | The identity provider, the client, or a merchant ID typed into the browser. |
| Session | Server session identified by an opaque cookie. The database stores a hash of the token and an expiry. | The raw token in the database, or `localStorage`. |
| Catalogue price and offer | Approved PostgreSQL rows at quote time. | A price sent by the client, or a later catalogue edit. |
| Discount amount | The server calculation in integer agorot. | A price sent by the client. Perkly does not collect this amount. |
| Merchant product payment | The merchant’s own till, outside Perkly. | PayPlus, a Perkly checkout, a cashier bill, or a browser return. |
| Membership charge | Perkly’s own PayPlus terminal, after server lookup confirms provider, environment, account, 1500 agorot, ILS, and captured status. | The provider redirect. A merchant sale. |
| Whether Perkly accepted the membership fee | PostgreSQL membership-period and append-only journal rows. | A uniqueness error. An unexpected extra membership capture is retained as an exception. |
| Membership access | Derived: inside a verified paid period, and not removed by a separately verified revocation. | A pending checkout, an unpaid invoice, or a client role. |
| Perkly stock | PostgreSQL available and reserved quantities plus append-only movements. | A CSV of physical stock, a PayPlus sale capture, or the merchant’s till. Whether a discount code reserves stock is not decided. |
| Branch facts for search | Approved branch-level fact rows with source, verification level, confirmed time, and expiry. | Model output. A merchant's own label of "Perkly-verified." |
| Accounting reports | A later mapping approved by the accountant. | The operational journal. The journal supports reconciliation and audit. It is not automatically a full general ledger. |

Emails, mutable product names, and browser-supplied merchant IDs are not financial keys. A membership identifier, when one exists, includes PayPlus and the environment. No adapter exists today. Do not create a merchant seller reference for PayPlus.

Personal data inside immutable financial rows stays minimal so a future retention workflow can still run. The retention schedule itself is O-10 and is not approved.

## 5. Domain and schema design

Migrations are created in the phase that owns the data. The groups below are the common design, not product tables. P01-02 applied `0001_foundation` only. Proposed storage for money is PostgreSQL `bigint` agorot. The major version is still O-03. Local Compose uses the `postgres:17` image as a proposal.

Use foreign keys, check constraints, scoped uniqueness, and indexes. Rates are integer basis points. Optimistic versions apply to stock edits.

### 5.1 Identity

| Entity | Key fields |
| --- | --- |
| User | Immutable internal ID. Identity-provider subject and pool. Email and verification time. Locale (`en`, `he`, or `ar`). |
| Session | User, hash of the opaque token, expiry, revocation. |
| OAuth flow | State, nonce, PKCE verifier stored as hashes, expiry, exact redirect URI. |

### 5.2 Merchants

| Entity | Key fields |
| --- | --- |
| Business | Approval status. No PayPlus seller reference. Merchant provider-onboarding is not a Perkly sale account. |
| Branch | Business, address, coordinates, timezone. Facilities live on the branch from the first migration that creates branches. |
| Staff membership | User, business, role, branch scope. |
| Invitation | Email binding, expiry, role, scope. |
| Merchant consent | Versioned text and acceptance time. |

Perkly approval and provider KYC are different states. Only an approved business can publish or accept new sales.

### 5.3 Facts

Branch amenities hold a structured value, a source, a verification level, a confirmed time, and an expiry. A merchant assertion is not independently Perkly-verified. Safety-related claims older than the working freshness window (W-02, 90 days) cannot satisfy a hard search constraint. Unknown is not yes.

### 5.4 Catalogue and offers

| Entity | Key fields |
| --- | --- |
| Listing | Product, service, or surplus. Merchant and branch. Integer reference price in agorot. Active flag. Stock-tracking mode. Terms. |
| Media | Validated reference. Public images and private business records use different stores. |
| Offer | Listing, percentage in basis points, start, end, pickup interval, reference-price evidence, approval state, review history. |

A published percentage below 300 basis points is invalid. No public offer is valid. The maximum percentage is O-01 and must not be invented as 90%.

### 5.5 Inventory

Branch and product available quantity, reserved quantity, and an optimistic version. Reservations. Append-only stock movements.

Available and reserved are different numbers. A hold moves quantity from available to reserved. Capture consumes reserved. Release moves reserved back to available once. A CSV import sets available-to-sell Perkly stock and does not write reserved.

### 5.6 Orders and bills

| Entity | Key fields |
| --- | --- |
| Order | User, one merchant, one branch, quote expiry, immutable line snapshots, totals in agorot, membership-eligibility snapshot, fulfilment state. |
| Line snapshot | Original, public saving, member saving, paid amount, quantity, offer reference. Sum of lines equals the order. |
| Bill request | Merchant, branch, post-public amount, expiry, opaque one-use claim token. No guessed product quantities. |

### 5.7 Payments, refunds, membership, finance

| Entity | Key fields |
| --- | --- |
| Payment attempt | Stable reference, order, provider, environment, account, amount, currency ILS, provider ID, state, verification time. At most one active or unresolved attempt per order. |
| Refund request | Review state, reason, line quantities. Separate from the money operation. |
| Refund operation | Stable provider operation, verified refunded total, explicit restock decision, operation state. |
| Membership agreement | Consent version, displayed ₪15, provider ID, provider state, billing anchor. |
| Paid period | Provider invoice identity, amount, start, end, refund amount. Unique invoice identity. |
| Access revocation | Separate verified fact. Does not delete the period. |
| Journal | Append-only. Not a general ledger. |
| Provider event | Imported raw identity and normalized result. |
| Reconciliation | Run, exception, owner, settlement, fee, dispute, invoice or credit-document reference. |

### 5.8 Operations and trust

Idempotency records (actor, action, key, request fingerprint, resulting operation). Webhook inbox. Transactional outbox and leased jobs. Audit events (append-only; runtime role cannot update or delete them). Notifications and delivery. Support cases. Privacy workflow. Rate buckets. Favourites. Verified-purchase reviews. Moderation reports. Bounded anti-abuse signals.

## 6. Pricing, holds, and jobs

Pricing rules and the integer formulas are D-16 in `DECISIONS.md` and section 6 of `PRODUCT_SPEC.md`. Domain code performs them with no network I/O. The result is a discount. It is not a merchant charge.

The roadmap's quote-hold and late-capture sequence assumed Perkly captured the sale. D-22 defers that sequence. Do not reserve stock, consume stock, or issue a compensating refund because a PayPlus product payment captured. Whether a discount code reserves stock is O-15.

Idempotency: the same key and the same fingerprint return the original operation. The same key and a different payload is a conflict. Keys are scoped to actor and action. Financial references are not reused after a cache expiry.

Jobs: business rows and the outbox row commit together. The worker leases with database locking, does provider I/O outside that transaction, and acknowledges only the lease it still owns. Retries use backoff. An expired lease can be picked up again. A terminal review state exists for operators. A worker whose lease expired cannot complete the job.

Provider calls must not run inside a SQL transaction that the driver may retry.

## 7. State transition tables

The order, merchant-payment, and merchant-refund tables below are the roadmap's old capture model. D-22 defers them. Do not implement a transition that charges, captures, refunds, or settles a merchant product sale. The membership states in section 7.4 are the only payment states still in scope, and they are not built.

States use the roadmap's names. A transition that is absent is not allowed. PayPlus status strings are not mapped.

### 7.1 Order

Partial refund amounts do not change fulfilment state. `fully_refunded` means the captured total has been refunded.

| From | Event | To |
| --- | --- | --- |
| `quoted` | Customer starts a payment attempt while the quote is valid | `awaiting_payment` |
| `quoted` | Customer cancels, or the quote expires, before a capture | `cancelled` or `expired` |
| `awaiting_payment` | Server lookup confirms capture | `paid` |
| `awaiting_payment` | Attempt definitively fails or is cancelled, and the quote is released | `cancelled` or `expired` |
| `awaiting_payment` | Hold expires with no capture | `expired` |
| `paid` | Staff marks ready | `ready` |
| `ready` | Single-use pickup succeeds and no conflicting refund blocks it | `fulfilled` |
| `paid` or `ready` | Verified outcome requires the money to be returned and fulfilment cannot continue | `refund_required` |
| `refund_required` | Verified refunds cover the captured total | `fully_refunded` |
| `fulfilled` | Verified refunds cover the captured total | `fully_refunded` |

`cancelled` and `expired` release reserved units once. A partial refund of a `fulfilled` or `paid` order leaves the fulfilment state unchanged until the captured total is fully refunded.

If a capture arrives after expiry, the order does not stay half-paid. Either stock is fully reacquired and the order becomes `paid` at the original snapshot, or the order becomes `refund_required` for one compensating refund.

### 7.2 Payment attempt

| From | Event | To |
| --- | --- | --- |
| (none) | Order is still a valid quote and no unresolved attempt exists | `creating` |
| `creating` | Hosted checkout was issued or the provider accepted the create | `pending` |
| `creating` or `pending` | Definitive decline or cancel from lookup | `failed` or `cancelled` |
| `creating` or `pending` | Lookup or timeout does not prove a terminal result | `unknown` |
| `pending` | Lookup confirms captured status, account, amount, and currency | `captured` |
| `unknown` | Authoritative lookup of the same reference returns a terminal result | `captured`, `failed`, or `cancelled` |

Authorization without capture stays out of `captured`. It remains `pending` or `unknown` until capture, failure, or cancellation.

A new attempt is inserted only when the previous attempt is `failed` or `cancelled`, the customer deliberately retries, and the quote is still valid. `creating`, `pending`, and `unknown` block a new reference.

A browser redirect never causes any row of this table.

### 7.3 Refund request and refund operation

| From | Event | To |
| --- | --- | --- |
| (none) | Customer submits quantities and a reason inside the captured remainder | `requested` |
| `requested` | In-scope manager, owner, or audited admin approves, with an explicit restock intent | `approved` |
| `requested` | That reviewer rejects | `rejected` |

The money operation is a different record:

| From | Event | To |
| --- | --- | --- |
| (none) | Approved request starts a provider refund, or a local simulator refund | `processing` |
| `processing` | Timeout or ambiguous lookup | `unknown` |
| `processing` or `unknown` | Lookup confirms success | `succeeded` |
| `processing` or `unknown` | Lookup confirms failure | `failed` |

`unknown` reserves the quantity and the amount. It is not permission to start another refund of those units. Stock increments at most once, and only after `succeeded` plus the approved restock decision.

### 7.4 Subscription names and access

Reserved subscription states: `pending`, `active`, `past_due`, `cancellation_pending`, `cancellation_scheduled`, `ended_revoked`, `failed`.

No provider mapping exists. O-07 forbids inventing the difference between `cancellation_pending` and `cancellation_scheduled`.

What is already required:

- `pending` and a pending checkout grant no paid access.
- A period is inserted only from a verified paid invoice, once per provider invoice identity.
- Fee refund, renewal failure, cancellation, and access revocation are separate facts.
- Already-paid access follows the approved policy. That policy is E05 and is not written.
- Customer-visible state must match verified provider facts once a provider exists. The local simulator must not be reported as that provider.

Membership access is derived. It is on only when the current time falls in a verified paid period and no verified revocation applies.

### 7.5 Dispute and job

Disputes use the provider's own stage labels once E01 supplies them. Perkly stores those labels and does not delete the capture or the refund. No Perkly dispute transition table is invented here.

| Job from | Event | Job to |
| --- | --- | --- |
| `pending` | A worker acquires the lease | `leased` |
| `leased` | The owning worker finishes | `completed` |
| `leased` | The lease expires and retries remain | `pending` |
| `leased` | Retries are exhausted or the error is terminal | `failed_requires_review` |
| `failed_requires_review` | An operator replays the job | `pending` |

`completed` is terminal. A worker that no longer owns the lease cannot acknowledge the job.

## 8. Adapter boundaries

Adapters live in `packages/integrations` and `packages/search`. Domain code calls a typed interface. It does not import a vendor SDK.

| Capability | Local mode | Hosted mode | Startup rule |
| --- | --- | --- | --- |
| Identity | Fixed fictional profiles, localhost only | Cognito, verified tokens, server sessions, separate admin pool with mandatory MFA | Local adapter only when mode is local and the listener is loopback |
| Membership fee only | A later local membership simulator may exist. A merchant-sale simulator is deferred and is not the launch path. | PayPlus for the ₪15 charge only, after E01. Sandbox or live must be explicit. No merchant terminal. | Simulator refused when mode is staging or production. Staging membership calls, when built, may use only `https://restapidev.payplus.co.il`. |
| Email | Local outbox | SES with bounce, complaint, and suppression handling | Outbox refused outside local |
| Search | Fixtures and ordinary SQL filters | An approved Bedrock model, or ordinary filters if the model is unavailable | Fixture model refused outside local |
| Images | Validated local directory | Validated objects in private S3, read by the public through CloudFront origin access control | Private records never use the public media path |

Hosted startup rejects demo identity, simulator payments, and demo search even if the environment file asks for them.

The payment interface is the membership capability list in `PAYMENT_CONTRACT.md`. Those names are not a PayPlus API. Do not add a merchant-sale operation to that interface. The adapter, when E01 allows it, is an in-process module. Do not add a second deployed bridge service unless a later design shows a concrete need.

A membership webhook, if later built, enters through `POST /api/v1/webhooks/payments/:provider` for the registered membership provider only. Authentication uses PayPlus’s approved raw-body rules. Acknowledgement is not a paid period. The route must not accept a merchant-sale event as a Perkly charge.

Bedrock, when E07 exists, may only turn query text and UI language into a strict intent schema. Database code applies hard filters and ranks real branch rows. The model must not create businesses, invent coordinates, grant benefits, take payment, or write the database. Merchant records, precise coordinates, identity, and financial details stay out of model input. Raw queries are not logged. Ordinary SQL discovery works when the model is down. Supported intent and unsupported topics are roadmap section 8.3. Children's names are not collected for search.

Configuration keys reserved for the implementation (not present as a running environment now):

| Key | Required behavior |
| --- | --- |
| `APP_MODE` | `local`, `staging`, or `production`. Hosted modes force HTTPS and real identity. |
| `AUTH_PROVIDER` | Local adapter only on loopback local mode. Otherwise Cognito. |
| `DATABASE_URL` and TLS | Runtime tasks use runtime credentials. Hosted database TLS verifies the certificate. |
| `APP_ORIGIN` | Exact public origin for cookies, callbacks, and CSRF. |
| `PAYMENT_PROVIDER` and `PAYMENT_ENV` | Disabled, or PayPlus for the membership fee only, with an explicit sandbox or live identity. Staging cannot take live charges and cannot call a merchant terminal. |
| New membership gate | Can pause new memberships while lookup, fee refund, cancellation, and membership reconciliation continue. There is no new-merchant-sale gate, because Perkly does not take that sale. |
| `SEARCH_PROVIDER` | Fixtures only in local mode. Hosted mode uses Bedrock or ordinary filters. |
| `EMAIL_PROVIDER` | Outbox only in local mode. Production transactional mail uses an approved SES identity. |
| Encryption key ring | Versioned key IDs. One active encryption key. Old keys decrypt only through a controlled migration. |
| Policy versions and URLs | Real approved terms and a monitored support contact before any live use. |

Secrets stay out of source, CDK context, browser assets, and logs. No secret exists in this phase.

## 9. What this design does not include

`0001_foundation` and `0002_local_fixtures` are the applied migrations. The API validates adapters at startup and still does not open a database connection. Local mode needs no AWS account. No membership adapter can be written until E01 supplies approved documentation. Merchant settlement through Perkly is withdrawn (D-22). PostgreSQL 17 is the local image proposal, not a selected RDS major (O-03).
