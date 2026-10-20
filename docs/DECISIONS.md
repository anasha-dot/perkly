# Perkly decision log

**Status:** Settled rules for the build. P01-01 added the local shell and did not change these decisions.
**Date:** 20 October 2026.
**Roadmap:** `Perkly_From_Scratch_Roadmap.md` version 1.0.
**How to read this file:** Settled rules stay as written unless Anas Hallumi changes them. Open choices are not decided by this file. Working defaults are the roadmap's starting values for later tasks. They are not new product debates.

Owner "Anas Hallumi" means the rule came from the agreed roadmap or from his later lock. Owner "Bot" means this phase fixed a single implementation reading so later code has one result. Owner "Anas Hallumi, through E01" means PayPlus is selected and the written confirmation is still outstanding.

## 1. Settled rules

### D-01. Free public use

- **Decision:** Anyone can browse, use public offers, buy, collect, request support or a refund, and review an eligible completed purchase without a membership.
- **Rationale:** The launch offer is useful before someone subscribes. Membership is an extra saving, not the right to shop.
- **Owner:** Anas Hallumi.
- **Effect:** Quotes and catalogue previews have a free price. Paid membership is never inferred from a browser flag.

### D-02. Membership price and interval

- **Decision:** Optional membership is ₪15 per calendar-month billing interval on the billing anchor the payment provider confirms. Stored and sent amount is 1500 agorot. The price shown to the customer remains ₪15. The interval is not automatically 30 days and not automatically the first calendar day.
- **Rationale:** The price is fixed. The anchor depends on the provider, so inventing "day 1" or "every 30 days" would misstate renewals.
- **Owner:** Anas Hallumi. The concrete anchor is filled in from the provider agreement (E01). It does not change the ₪15 price.
- **Effect:** Consent stores the displayed ₪15 price, the terms version, and explicit recurring consent. Access begins only after a verified paid period.

### D-03. Extra 3% after public discounts

- **Decision:** At a participating business, an eligible paid member receives an additional 3% of the post-public amount. The business funds that discount. It is applied once, after the public offer, with half-up rounding once on the order total.
- **Rationale:** A 10% public offer plus membership is a 12.7% reduction from the reference price, not 13%. The worked examples in the roadmap are the test oracle.
- **Owner:** Anas Hallumi.
- **Effect:** Pricing tests must match the ₪100 rows: no offer → ₪97.00; 3% → ₪94.09; 10% → ₪87.30; 20% → ₪77.60. Non-participating businesses do not receive this benefit.

### D-04. Public percentage floor, and no offer is allowed

- **Decision:** A published percentage offer discounts at least 3%. A product may be sold with no public promotion.
- **Rationale:** The floor keeps public offers meaningful. Forcing a promotion on every product is not the rule.
- **Owner:** Anas Hallumi.
- **Effect:** Offer approval rejects a published percentage below 300 basis points. An empty public offer is valid and yields a zero public saving.

### D-05. No platform commission at launch

- **Decision:** Perkly does not take a sales commission, a buyer fee, a seller cut, or a share of the discount. Merchant acquiring fees on sales are the merchant's. Perkly bears membership-collection costs under the real provider agreement.
- **Rationale:** The launch revenue model is membership, plus merchant-funded discounts. Merchant gross sales are not Perkly revenue.
- **Owner:** Anas Hallumi.
- **Effect:** Checkout totals do not add a platform fee. Fee amounts from the provider stay out of the customer merchandise total. Introducing a commission later requires a new decision from Anas.

### D-06. Integer agorot and basis points

- **Decision:** The only currency is ILS. Persist money as integer agorot. Persist percentage rates as integer basis points. Do not use floating-point money.
- **Rationale:** Half-agorot drift would make refunds and member savings impossible to reconcile.
- **Owner:** Anas Hallumi.
- **Effect:** APIs, snapshots, journals, and receipts use integers. Display formatting is separate from storage. ₪15 is 1500. 3% is 300 basis points.

### D-07. Three separate money stories

- **Decision:** Public savings, extra member savings, and membership fees are stored and shown separately. Net member value uses one reporting window and equals confirmed extra savings, adjusted for returned purchases, minus membership fees, plus confirmed fee refunds. Public offers do not inflate the membership benefit.
- **Rationale:** A member should be able to see whether the extra 3% covered ₪15 without mixing in the public sale price.
- **Owner:** Anas Hallumi.
- **Effect:** Savings responses and reports cannot collapse these into one "you saved" number without also showing the parts.

### D-08. One public offer, then the member benefit

- **Decision:** Each line receives the single best eligible approved public offer. The member benefit is applied once to the post-public total. Public offers do not stack.
- **Rationale:** Stacking several public promotions would contradict the published examples and the merchant's approved discount.
- **Owner:** Anas Hallumi.
- **Effect:** Quote code selects one public rate per line before the member step. A cashier bill is already post-public, so Perkly does not apply a public percentage again.

### D-09. One business and one branch per payment

- **Decision:** A basket and its payment contain one business and one branch.
- **Rationale:** Settlement, stock, and pickup are branch-scoped. Multi-business baskets are an excluded later feature.
- **Owner:** Anas Hallumi.
- **Effect:** Quote creation rejects mixed branch or mixed business lines.

### D-10. The advertised 3% is not narrowed in secret

- **Decision:** Participating-business coverage is explicit. There is no hidden product exclusion and no checkout surcharge that contradicts the advertised 3% benefit. A category that cannot receive the benefit needs a documented public policy before it is excluded.
- **Rationale:** The member offer is a simple extra 3% after public discounts at participating businesses.
- **Owner:** Anas Hallumi. Any category policy is E05 and does not exist yet.
- **Effect:** Until a public exclusion policy exists, eligible lines at a participating business receive the benefit. No surcharge line is added at checkout.

### D-11. English, Hebrew, and Arabic with RTL

- **Decision:** Customer, merchant, support, and essential admin flows, including Perkly-controlled receipts and notifications, are available in English, Hebrew, and Arabic. Hebrew and Arabic render right-to-left.
- **Rationale:** The pilot is near Kfar Manda and the product promise is a trilingual UI from the first screens, not a translation pass at the end.
- **Owner:** Anas Hallumi. Native-speaker review of recurring and refund wording is E06 and is not done.
- **Effect:** Locale codes are `en`, `he`, and `ar`. Layout direction follows the locale. Missing translations are unfinished work, not a reason to ship one language in a purchase flow.

### D-12. Pickup first

- **Decision:** The first fulfilment mode is collection at the branch. A service purchase is an entitlement with redemption terms, not a guaranteed appointment.
- **Rationale:** Delivery, point-of-sale sync, and scheduling are later products with their own rules.
- **Owner:** Anas Hallumi.
- **Effect:** No delivery fee, slot grid, or POS stock sync is in scope. Pickup codes are single-use and bound to the merchant.

### D-13. Pilot near Kfar Manda

- **Decision:** Start with a controlled pilot near Kfar Manda. Expand only after fulfilment is reliable and customers return.
- **Rationale:** The roadmap chooses a small geography instead of a national launch.
- **Owner:** Anas Hallumi.
- **Effect:** Marketing scope and the first merchants stay local. A distance radius in kilometres is not defined (O-05).

### D-14. Stack and shape

- **Decision:** Vue 3 and TypeScript on the web. Node.js 24 LTS, TypeScript, and Express on the server. PostgreSQL is the store for money, stock, and jobs. One modular monolith, plus a worker process from the same release artifact, in one repository. Local adapters run before any AWS integration.
- **Rationale:** The roadmap matches a single transactional database and a stack the owner can maintain. Kubernetes, a second database, microservices, Redis, and a vector database are out unless a later measurement shows they are required.
- **Owner:** Anas Hallumi.
- **Effect:** Phase 01 creates this shape. Package versions are chosen then, from current compatible releases, and locked. This phase does not install them. The PostgreSQL major remains O-03.

### D-15. Server-confirmed money

- **Decision:** A return URL, a browser success parameter, or a client flag is not proof of payment, membership, or admin rights. Unknown provider outcomes stay unknown until an authoritative lookup of the same reference resolves them. Authorization alone is not capture.
- **Rationale:** The customer can close a tab, refresh, or be redirected before the provider has committed. Double charges and false "paid" states are the failure this rule prevents.
- **Owner:** Anas Hallumi.
- **Effect:** Payment and membership state machines in `ARCHITECTURE.md` treat lookup as the transition into captured or paid. Idempotency keys survive retries.

### D-16. Pricing and refund arithmetic

- **Decision:** Use roadmap section 6.2. Half-up to one agora. Member savings use largest remainders. A 100-agorot line of quantity 3 refunds as 33, then 33, then 34. Line amounts sum to the order. Zero and negative charges are rejected.
- **Rationale:** These are the published acceptance numbers for later tests AT01–AT03.
- **Owner:** Anas Hallumi for the outcomes. Bot for the two formulas below, which are the unique simple integer readings of those outcomes.
- **Effect:** Implementations use `(amountAgorot * rateBasisPoints + 5000) / 10000` with integer division for positive half-up. Cumulative refund of `n` units is `(paidAgorot * n) / originalQuantity` with integer division. Tie on member-saving remainders goes to the earlier snapshot line index.

### D-17. First-release boundary

- **Decision:** Build the launch list in roadmap section 2.4. Do not build advertising, sponsored placement, prize draws, cashback wallets, financing, platform custody of merchant money, delivery, multi-business baskets, appointment scheduling, universal POS sync, or native store apps.
- **Rationale:** Those features need separate legal, provider, and product decisions. The membership model does not depend on them.
- **Owner:** Anas Hallumi.
- **Effect:** Backlog tasks do not include them. A pull request that adds one of them without a new decision is out of scope.

### D-18. No handheld "mark paid"

- **Decision:** Administrators do not get an arbitrary mark-as-paid action, an unverified entitlement grant, or a delete of financial history. Corrections are verified events or an explicitly authorized adjustment with a reason.
- **Rationale:** Financial history is the audit trail for reconciliation.
- **Owner:** Anas Hallumi.
- **Effect:** Admin API design omits those operations. Adjustments, when they exist, are append-only and attributed.

### D-19. Simulators stay off the hosted environments

- **Decision:** Local mode may use fictional identity, a payment simulator, an email outbox, search fixtures, and a local image directory. Staging and production must refuse demo identity, simulator payments, and demo search. There is no local password system that becomes production login.
- **Rationale:** A flag left on in a hosted environment would fake payments or identity.
- **Owner:** Anas Hallumi.
- **Effect:** Adapter selection is a startup check. Phase 01 implements it. This phase does not.

### D-20. Roles cannot cross businesses

- **Decision:** Customers, cashiers, managers, business owners, and administrators have the capabilities in roadmap section 5.4. Multiple roles do not widen tenant scope. Staff invites, owner changes, and provider-detail changes are restricted. Granting admin is a separate provisioning process.
- **Rationale:** A cashier at one branch must not read another business. A customer pool token must not become an administrator.
- **Owner:** Anas Hallumi.
- **Effect:** The role matrix in `ARCHITECTURE.md` is the requirement for server guards.

### D-21. PayPlus is the payment provider

Superseded in part by D-22 on 20 October 2026. Keep this entry. Do not follow its merchant-terminal sentence. PayPlus is not the merchant acquirer.

- **Decision:** On 20 October 2026 Anas Hallumi locked PayPlus as Perkly’s payment provider: each merchant has their own PayPlus terminal for product sales, Perkly has a separate terminal for the ₪15 membership, Perkly takes no sales commission, checkout is a hosted payment page only so Perkly never sees PAN or CVV, staging may call only https://restapidev.payplus.co.il and must refuse the production host and live keys, Perkly keeps integer agorot and sends PayPlus exact two-decimal shekels, and tax documents use Invoice+ on the seller’s own account, with Morning, iCount, or an accountant if a merchant will not enable Invoice+, while Perkly still needs an accountant to file VAT. Cardcom is the runner-up only if PayPlus cannot provide an importable chargeback feed or a PAN-free captured-sale refund. E01 is not complete.
- **Rationale:** Anas locked the recommendation in `payment-provider-recommendation.md`. That file is the research record and is not replaced by this decision. PayPlus has not confirmed fees, the settlement bank, the recurring day, idempotency, PAN-free refunds, the sandbox, or a chargeback export.
- **Owner:** Anas Hallumi.
- **Effect:** Historical. D-22 replaces the merchant-payment effect. The Cardcom runner-up conditions in this entry apply only to the membership charge, and only as D-22 states them. D-01 through D-20 are unchanged.

### D-22. Merchant sales stay outside Perkly; PayPlus is membership only

- **Decision:** On 20 October 2026 Anas Hallumi corrected the payment model. This supersedes the merchant-payment parts of D-21. Perkly does not process, capture, refund, or settle the payment between the customer and the merchant. Do not use PayPlus, or any provider, for merchant product sales. There is no merchant PayPlus terminal. Perkly’s role at the purchase is to activate the discount via a code. The merchant charges the customer on the merchant’s own till, outside Perkly. Perkly charges the ₪15 membership inside the app, on Perkly’s own PayPlus account and terminal. Hosted payment page only. Perkly never sees PAN or CVV. PayPlus remains the provider for that membership charge only. Cardcom remains the runner-up only for that membership charge, on the same conditions as D-21: only if PayPlus cannot provide an importable chargeback feed or a PAN-free refund of that charge, and only after Cardcom confirms an importable chargeback feed and a sandbox host that is not `https://secure.cardcom.solutions`.
- **Rationale:** Anas withdrew merchant acquiring after D-21. He then answered the membership question the same day: the ₪15 charge stays inside Perkly, on Perkly’s own PayPlus terminal. The merchant till is the sale. A code activates the discount. Code format, expiry, single-use, merchant confirmation, and how savings are verified were not stated and are not invented here.
- **Owner:** Anas Hallumi.
- **Effect:** Merchant checkout, cashier-bill payment, merchant settlement, and merchant refunds through Perkly are `deferred_by_owner`. Phase 05 merchant-sale tasks are not the launch path. P06-02, membership billing, stays `blocked_external` on the narrower E01. E01 asks only about Perkly’s membership account: fees on that deposit, the recurring charge day, idempotency, PAN-free membership refunds, the sandbox host, Invoice+ on Perkly’s legal name for the ₪15, and a chargeback export. Do not ask PayPlus to settle a merchant sale. Staging for a future membership call may use only `https://restapidev.payplus.co.il` and must refuse `https://restapi.payplus.co.il` and live keys. Perkly stores 1500 agorot and would send PayPlus 15.00 shekels. That adapter is not built.

## 2. Open choices

O-01 and O-03 stay open. O-02 is withdrawn for merchant sales. O-04 is closed by D-21 and narrowed by D-22. O-15 lists the undecided discount-code mechanics.

### O-01. Public-offer maximum

- **Decision:** Unset. The minimum remains 3%. The roadmap's proposed launch check of 3–90% is a hypothesis, not a ceiling.
- **Rationale:** The roadmap says to record the maximum as a product decision. Choosing 90% here would pretend Anas already signed it.
- **Owner:** Anas Hallumi.
- **Effect:** Offer validation enforces the 3% floor only, until Anas sets a ceiling. Quotes still reject zero and negative totals under D-16. P03-04 must not hard-code 90% as policy.

### O-02. Settlement confirmation

- **Decision:** Withdrawn for merchant sales. D-22: Perkly does not settle a merchant product sale, and there is no merchant PayPlus terminal. Do not ask PayPlus whether a merchant sale settles to the merchant’s bank.
- **Rationale:** The merchant charges on the merchant’s own till, outside Perkly. The old question assumed Perkly was in that payment.
- **Owner:** Anas Hallumi.
- **Effect:** Merchant settlement work is `deferred_by_owner`. Fees on Perkly’s membership deposit remain an E01 question. They are not a merchant-settlement question.

### O-03. PostgreSQL major version

- **Decision:** Unset. PostgreSQL 17 is the roadmap's proposed starting major, subject to support in the chosen AWS account and region. Development, CI, and RDS must use the same major once it is chosen.
- **Rationale:** The roadmap forbids treating a version number as permanently correct without account-region validation.
- **Owner:** Anas Hallumi for the account and region facts. The local image proposal is recorded by the build.
- **Effect:** P01-02 runs local Compose from the `postgres:17` image. On 20 October 2026 that image reported PostgreSQL 17.11. This is not a choice of the RDS major. O-03 stays open until the account and region check is written here.

### O-04. Payment provider

- **Decision:** Closed on 20 October 2026 by D-21 and narrowed the same day by D-22. PayPlus is the membership provider only. PayPlus is not the merchant acquirer.
- **Rationale:** Anas selected PayPlus, then removed it from merchant product sales.
- **Owner:** Anas Hallumi.
- **Effect:** See D-22. No merchant-sale route may call PayPlus. Membership billing waits on E01. No route exists.

### Further open items that this phase also does not decide

| ID | Unset item | Owner | Effect if someone assumes it |
| --- | --- | --- | --- |
| O-05 | Kilometre radius for "near Kfar Manda" | Anas Hallumi | Pilot geography would be an invented boundary. |
| O-06 | Commercial ceilings for price, quantity, and order size | Anas Hallumi | A made-up ₪ cap would be product policy. Technical overflow bounds still have to exist when pricing code is written, and must be logged then. |
| O-07 | Provider mapping of "cancellation pending" versus "cancellation scheduled" | Anas Hallumi via E01, then P06 | Those two names stay reserved. No transition between them is approved. |
| O-08 | Which purchase categories, if any, are publicly excluded from the 3% benefit | Anas Hallumi via E05 | Silent exclusions are forbidden by D-10. |
| O-09 | VAT filing, and the accountant’s required document type for the ₪15. D-22 limits Invoice+ to Perkly’s own legal name for the membership fee. Perkly does not issue the merchant’s sale document. | Anas Hallumi via E05 and E01 | An order summary must not be treated as a tax document. Do not send a merchant sale through PayPlus Invoice+. |
| O-10 | Retention periods and the legal wording of terms | Anas Hallumi via E05 | Privacy copy in the product would be a placeholder. |
| O-11 | Bedrock model, inference profile, and processing region | Anas Hallumi via E07 | A guessed model ID is not acceptable. |
| O-12 | AWS region. `il-central-1` is only a proposal | Anas Hallumi via E03 | Infrastructure must not be created on an unverified region. |
| O-13 | Whether a later pilot may ship filters without Bedrock | Anas Hallumi | Filters-only is a scope change. It does not complete the AI feature. |
| O-14 | Numeric operating targets after measurement (load, p95, 99.9% objective, RPO of five minutes, RTO of two hours) | Anas Hallumi after drills | The roadmap figures are targets, not measured results. |
| O-15 | Discount-code mechanics: format, expiry, single-use, merchant confirmation, and how savings are verified. D-22 decides only that a code activates the discount. | Anas Hallumi | Inventing any of these would be a new product rule. |

## 3. Working defaults

These are the roadmap's stated starting values. They are in force for the relevant build task until Anas replaces them in this log.

| ID | Default | Rationale | Owner | Effect |
| --- | --- | --- | --- | --- |
| W-01 | Quote hold at most 10 minutes, and at most 3 active holds per customer | Roadmap section 6.3 proposed defaults | Anas Hallumi | P04-02 uses these limits. Expiry is also bounded by offer end, pickup end, and membership-eligibility end. |
| W-02 | Safety-related branch facts older than 90 days do not satisfy a hard search constraint | Roadmap section 8.3 proposed freshness window | Anas Hallumi | Unknown does not mean yes. The window can change before P08-01. |
| W-03 | Pilot proposal of 3–5 merchants and 50–100 invited adults | Roadmap phase 11 proposal | Anas Hallumi | Not a current launch approval. P11-04 is where this is applied, if still wanted. |
| W-04 | Single region, no automatic regional failover | Roadmap section 11.4 | Anas Hallumi | Do not add a second-region design without a new requirement and budget. |
| W-05 | SQL via `pg` and numbered migrations, unless an ORM keeps transactions and locks equally explicit | Roadmap section 4.1 | Anas Hallumi | Phase 01 starts without an ORM. |
| W-06 | Proposed RDS backup window of 14 days | Roadmap section 11.1, to be reviewed with the owner | Anas Hallumi | Not an active backup. No AWS account is in use. |

## 4. What remains open after D-22

Merchant product payments are outside Perkly. PayPlus is not approved for the membership charge. Still open: the public-offer maximum (O-01), the PostgreSQL major (O-03), discount-code mechanics (O-15), and the membership E01 items: fees on Perkly’s deposit, the recurring charge day, idempotency, PAN-free membership refunds, sandbox proof, Invoice+ on Perkly’s legal name for the ₪15, and a chargeback export. P01-01 and P01-02 are done. No task from P01-03 onward is done. O-03 stays open. AT01–AT34 have not been run. Phase 05 is not the launch path. P06-02 is `blocked_external` on E01.
