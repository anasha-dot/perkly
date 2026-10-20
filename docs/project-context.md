# Perkly project context

**Updated:** 20 October 2026
**Position:** P01-01 is done. The local Vue shell, Express API, and idle worker run. D-22 is the payment model. No database, checkout, PayPlus client, or cloud resource exists. Nothing is production-ready.

## Goals

Perkly lets people near Kfar Manda discover participating local businesses and activate a discount with a code. The merchant charges the customer on the merchant’s own till. Perkly does not take that payment. Membership is optional. Public offers are free to use. Members pay ₪15 inside the app and receive an extra merchant-funded 3% after public discounts at participating businesses. Perkly takes no sales commission.

The client is a responsive installable web app in English, Hebrew, and Arabic, with Hebrew and Arabic right-to-left. The first fulfilment mode is pickup. How a discount code relates to pickup is not decided.

## Constraints

- The server, not the browser, decides the discount, stock rules, roles, and whether a membership charge succeeded. It does not decide that a merchant till payment succeeded.
- Vue 3 and TypeScript, Node.js 24 and Express, PostgreSQL, and a modular monolith. Local adapters come before AWS.
- Money is integer agorot inside Perkly. A future membership call sends PayPlus 15.00 shekels. Public savings, member savings, and membership fees stay separate.
- PayPlus is the provider for the ₪15 membership only, on Perkly’s own account and terminal. Hosted payment page only. Perkly never sees PAN or CVV. There is no merchant PayPlus terminal.
- Cardcom is the runner-up only for that membership charge, and only on the conditions in D-22.
- A code activates the merchant discount. Format, expiry, single-use, merchant confirmation, and how savings are verified are open.
- Invoice+ is for the ₪15 on Perkly’s legal name. Perkly does not issue the merchant’s sale document. Perkly still needs an accountant to file VAT.
- E01 is not complete. It covers only fees on Perkly’s membership deposit, the recurring charge day, idempotency, PAN-free membership refunds, the sandbox host, Invoice+ for the ₪15, and a chargeback export. Do not ask PayPlus to settle a merchant sale.
- Phase 05 merchant-sale tasks are not the launch path. P06-02 stays blocked on this narrower E01.
- PostgreSQL’s major version and the public-offer ceiling are not decided.
- Advertising, wallets, lending, delivery, multi-business carts, appointments, POS sync, and native store apps are out of the first release.
- Do not create billable infrastructure, send real messages, call paid AI, or move real money without a later authorization.

## Where the documents live

All of these are in `docs/` next to this file:

| Document | What it is |
| --- | --- |
| `Perkly_From_Scratch_Roadmap.md` | Source roadmap, version 1.0. Do not rewrite it. |
| `PRODUCT_SPEC.md` | Scope, pricing, promises, workflows, exclusions. |
| `DECISIONS.md` | Settled rules. D-22 supersedes the merchant-payment parts of D-21. |
| `payment-provider-recommendation.md` | Research record. Merchant use is withdrawn. Do not rewrite the research. |
| `PAYMENT_CONTRACT.md` | Membership checklist. Not PayPlus approval. Not a merchant acquirer. |
| `ARCHITECTURE.md` | Components, roles, schema, states, sources of truth, adapters. |
| `API.md` | Proposed `/api/v1` contract. Merchant charge routes are deferred. |
| `TASK_STATUS.json` | Every Section 7 task. |
| `IMPLEMENTATION_LOG.md` | What was actually done. |
| `OWNER_SETUP.md` | E01–E09. E01 is membership only and pending. |
| `RELEASE_GATES.md` | Launch checklist. None complete. |
| `TEST_STRATEGY.md` | How AT01–AT34 will be proved. None have been run. |

## Next

The next unblocked build task is P01-02: PostgreSQL, migrations, a disposable test database, and transaction helpers. Anas’s next payment action is the membership-only E01 questions in `OWNER_SETUP.md`. That work does not block P01-02. P06-02 stays blocked until those answers exist. Do not start Phase 05 as the launch path.
