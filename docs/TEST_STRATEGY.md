# Test strategy

**Status:** Plan. P01-01 ran locale unit tests. P01-02 migrated a disposable local database and checked that test and reset commands refuse unsafe targets. No AT01–AT34 scenario has been run. No CI job exists.
**Date:** 20 October 2026.
**Acceptance set:** AT01–AT34 from roadmap section 10. Line-coverage percentages do not replace these scenarios.

## 1. How a scenario becomes evidence

When a scenario is actually run, write a sanitized note at `docs/evidence/AT##-<short-name>.md` containing:

- the task ID that claimed the proof
- the command
- the date
- the git commit, once a repository exists
- the environment (local disposable database, simulator, provider sandbox, or live)
- the result
- what did not run, and why

Until that note exists, the scenario status is `not_run`. Simulator results and provider-sandbox results are stored as different notes. A passing simulator never closes a sandbox or live scenario.

Disposable databases only. Reset commands must refuse staging and production targets. No such command exists yet.

## 2. Kinds of proof

| Kind | Where it runs | Used for |
| --- | --- | --- |
| Unit | `packages/domain` pricing and policy functions | Exact agorot, with no network and no clock surprise except injected time |
| Database integration | Native PostgreSQL, more than one connection | Locks, idempotency, grants, outbox |
| Contract | Adapter tests against recorded approved payloads, then the real sandbox | Provider and Cognito behavior |
| Browser | Playwright against the local or staging origin | Customer and merchant flows, not payment truth |
| Device | Physical iPhone, Android, and desktop, plus a screen reader | AT28 and release gate G07 |
| Live | Owner-authorized provider and bank records | AT34 only |

Browser success text is not proof of payment. Payment proof is the server row after lookup.

## 3. Scenarios

Every row below is `not_run`. The "Proved in" column is the task that must produce the evidence. It is not a claim that the task is done.

| ID | Pass condition | Kind | Proved in | Status |
| --- | --- | --- | --- | --- |
| AT01 | Free and member prices with no public offer and with 3%, 10%, and 20% offers match section 2 of the roadmap and the server algorithm. | Unit | P04-01 | not_run |
| AT02 | Several lines, tiny amounts, rounding, and large inputs. Allocations sum exactly. Invalid bounds are rejected. No overflow and no float drift. | Unit | P04-01 | not_run |
| AT03 | Partial quantity returns in more than one sequence. The refund total never exceeds the capture. A full return equals the capture. The 100-agorot quantity-3 line refunds 33, then 33, then 34. | Unit | P04-01 | not_run |
| AT04 | Independent buyers contend for the last unit. At most one reservation succeeds. Stock does not go negative. | Database integration, concurrent connections | P04-02 | not_run |
| AT05 | CSV and edit races against a new hold, a capture, and an expiry. Versions and locks prevent a lost update and a double release. | Database integration | P03-03, P04-02 | not_run |
| AT06 | Capture arrives after the offer, the hold, or the member period ends. The original quote is kept. All stock is recovered, or exactly one compensating refund is created. | Database integration | P04-02, P05-04 | not_run |
| AT07 | A client edits the amount, account, merchant, or member flag. The server rejects it and uses the approved quote and account. | Integration and browser | P04-02, P05-02 | not_run |
| AT08 | Repeated pay clicks, refresh, and a changed body under the same idempotency key. One operation for the same action. A changed body conflicts. | Integration | P04-04, P05-02 | not_run |
| AT09 | The worker dies after the provider accepts a charge or a refund. Restart continues the same operation and writes one journal effect. | Integration | P04-04, P05-04 | not_run |
| AT10 | An old worker continues after its lease expired. Overlapping workers do not duplicate the economic effect. | Integration | P04-04 | not_run |
| AT11 | Invalid, replayed, duplicate, lost, and out-of-order webhooks. Authentication and durable deduplication hold. Polling recovers a miss. A capture is not downgraded. | Contract | P05-04 | not_run |
| AT12 | Failed 3-D Secure, a browser success parameter, and an unknown lookup. No unverified paid state. Unknown does not start a new reference. | Simulator, then sandbox | P05-02 for the simulator, P05-05 for the sandbox | not_run |
| AT13 | Staging is given live credentials, hosts, or account IDs. Startup or the financial operation is rejected. | Integration | P01-03 for the startup rule, P10-04 for hosted proof | not_run |
| AT14 | A recurring invoice is duplicated, or an agreement is only marked active or unpaid. Only a verified paid invoice grants access, and the fee is recorded once. | Unit and contract | P06-02 | not_run |
| AT15 | Renewal fails and later recovers. Cancellation races with creation or renewal. No unearned period and no duplicate agreement. Customer state matches the provider. | Integration | P06-03 | not_run |
| AT16 | End of month, leap year, timezone and daylight-saving, and fee refunds. Confirmed periods hold. Cancellation, fee refund, and access revocation stay distinct. | Unit | P06-03, P06-04 | not_run |
| AT17 | Wrong merchant, QR guessing, replay, and a pickup that races a refund. One redemption. Rate limits and transactional conflicts hold. | Integration and browser | P07-01 | not_run |
| AT18 | Duplicate or concurrent partial and full refunds, and a timeout. Bounds hold. An unknown refund stays reserved. Stock is restored at most once. | Integration | P07-02 | not_run |
| AT19 | A refund, chargeback, or reversal started in the provider dashboard is imported once. Money facts stay correct. No unexamined double credit. | Contract | P07-03 | not_run |
| AT20 | Fees, reserves, refunds, payouts, and receipt failures. Statements reconcile, or each exception has an owner. The correct document is issued and access-controlled. | Contract | P07-04, P07-05 | not_run |
| AT21 | A cross-user or cross-business request, or an unauthorized cashier action, is denied on read, write, and export, with no private body. | Integration | P02-03 | not_run |
| AT22 | A customer token on an admin route, and invalid OAuth, CSRF, or session. No privilege bypass. Admin requires the admin pool, assurance, and grant. | Integration | P02-02, P02-03 | not_run |
| AT23 | Account closure with an active subscription, order, or refund. Verified cancellation, remaining obligations, a scoped export, and the approved erasure or retention. | Integration | P09-02 | not_run |
| AT24 | Oversized or fake images, malicious text and CSV, and invitation theft. Validation, re-encoding, CSV safety, and identity binding hold. | Integration | P03-02, P03-03 | not_run |
| AT25 | Missing or stale facts, negation, an unsupported need, and missing ages or location. No false hard-constraint match. A precise clarification or an empty result. | Unit and fixtures | P08-02, P08-04 | not_run |
| AT26 | A real Bedrock timeout, throttle, cold schema, invalid output, and shared quota. Safe fallback. Recorded quality, latency, and cost. No raw-query logs. | Paid evaluation | P08-03, P08-04 | not_run |
| AT27 | Offline or reopened PWA, camera denied, abandoned checkout. The server result is recovered. Offline UI cannot show a usable paid confirmation. | Browser | P09-01 | not_run |
| AT28 | English, Hebrew, and Arabic, keyboard, screen reader, and physical mobile. Critical flows are operable. Amounts and consent are readable in RTL. | Device | P09-01, P11-02 | not_run |
| AT29 | SES bounce or complaint, or a crash after acceptance. Suppression and delivery are visible. A duplicate email does not duplicate a money movement. | Integration | P09-03 | not_run |
| AT30 | Restore with pending jobs and encrypted refresh and pickup fields. Keys and balances are checked. The drill cannot charge real money. Provider-event recovery is tested. | Operations drill | P10-05 | not_run |
| AT31 | A bad release, mixed API and worker versions, and secret or key rotation. Recovery stays compatible. Financial history is not lost. Ciphertext remains readable through the key migration. | Operations drill | P09-04, P10-05 | not_run |
| AT32 | Provider, worker, and database outages, and the pause-new-sales control. New charges stop when required. Recoveries still run. Alerts reach a named person. | Operations drill | P10-05 | not_run |
| AT33 | Measured sustained and burst load across many connections and workers. Meets the agreed targets, or the admitted pilot capacity is explicitly reduced. Money and stock invariants hold. | Load | P11-01 | not_run |
| AT34 | A controlled live charge, partial and full refund, membership renewal, and bank settlement. Provider, bank, document, and application records agree. | Live | P11-03, P11-04 | not_run |

AT26 is not satisfied by a synthetic JSON fixture. AT34 is not satisfied by the local simulator or by the sandbox. AT34 stays reserved until P11-03 and P11-04.

## 4. Targets that are not measurements

The roadmap proposes these as targets to validate later. None has been measured. None is a guarantee.

- Load rehearsal: 100 concurrent browsing sessions, 10 checkouts per minute, and a last-unit burst, with the duration and dataset written down.
- App-owned browse and quote p95 under 500 ms at that load. Provider and AI latency reported separately.
- Monthly availability objective 99.9% for app-owned core endpoints, with exclusions and provider outages stated separately.
- Database recovery objective: RPO up to five minutes and RTO up to two hours for the tested incident class, proved by a restore exercise.
- Financial correctness: no unexplained discrepancy. Pending and unknown operations stay visible with age, owner, and resolution state.

P11-01 records AT01–AT33 coverage. P11-02 records the physical and recovery reviews. This phase records neither.

## 5. What Phase 00 checked

Phase 00 checked that these planning documents exist and that `TASK_STATUS.json` parses. That check is not AT01–AT34. The implementation log records the actual commands after they are run.
