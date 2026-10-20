# Owner setup

**Owner:** Anas Hallumi
**Recorded:** 20 October 2026
**Readiness:** E01 through E09 are all pending. PayPlus is the membership provider only (D-22). No PayPlus account is connected. No merchant PayPlus terminal will be connected. No domain or repository is connected to this project.
**Secrets:** Do not paste AWS keys, payment secrets, card numbers, or merchant KYC files into chat or into git. Store them in an approved secret tool and send only reference names plus public documentation URLs.

Phase 00 does not need any of these items to be finished. The next build task is P01-01, which is a local project skeleton. The "Blocks" line on each item is the later task that cannot be completed until the item is ready. Preparation of code that does not call the external service can continue while the item is pending.

## Non-secret inputs the implementation will need later

| Input | Item | Value today |
| --- | --- | --- |
| Provider display name | E01 | PayPlus, membership only. Cardcom is the runner-up only for that ₪15 charge, on the D-22 conditions. |
| Public documentation URL and the document date or version | E01 | Research only: `payment-provider-recommendation.md`, checked 20 October 2026. Merchant use of that file is withdrawn. Index: https://docs.payplus.co.il/reference/llms.txt. Not an approval pack. |
| Merchant sale settlement | E01 | Withdrawn. Do not ask PayPlus. The merchant charges on the merchant’s own till. |
| Perkly membership account | E01 | Decided: Perkly’s own PayPlus account and terminal for ₪15. Not approved. |
| Billing-anchor description | E01 | None. Ask question 2 below. |
| Sandbox and live hostnames to allow | E01, E02 | Staging may call only `https://restapidev.payplus.co.il`. Production host `https://restapi.payplus.co.il` and live keys are refused in staging. Sandbox proof is not done. |
| Secret reference names, not the secret values | E02 | None |
| AWS account IDs for staging and production, not keys | E03 | None |
| Chosen region after a support check | E03 | `il-central-1` is only a proposal |
| Domain name | E03, E04 | None |
| Support mailbox address | E04 | None |
| Approved policy URLs and version labels | E05 | None |
| Bedrock model ID and region, after the account lists them | E07 | None |
| Repository URL | E09 | None. This Phase 00 folder is not a git repository. |

When a value becomes real, add it to this table and to the blank table in `PAYMENT_CONTRACT.md`. Do not invent it.

## E01. Membership provider approval

**Ready when:** PayPlus confirms the membership items below for Perkly’s own account. Merchant product sales are not part of this item.

**Readiness:** Pending. D-22 selects PayPlus for the ₪15 membership only. `PAYMENT_CONTRACT.md` is the checklist. It is not this confirmation. P06-02 is `blocked_external` on this item. Phase 05 is not the launch path.

**Blocks completion of:** P06-02. It does not block P01-01. It does not authorize a merchant terminal.

**Exact next owner action:** Send these questions to PayPlus and keep the written answers. Do not ask PayPlus to settle a merchant sale.

1. **Fees on Perkly’s deposit.** Confirm the fees for the ₪15 membership are deducted on Perkly’s own deposit. Send the rate card. No public rate was found. There is no merchant-sale deposit.
2. **Recurring charge day.** For a monthly membership, what day is charged, including the 29th, 30th, 31st, and 29 February, in Asia/Jerusalem? Confirm it is not a fixed 30-day period and not forced to the first of the month. Confirm a failed renewal creates no paid period.
3. **Idempotency.** If the membership create is repeated after a timeout with the same reference, does PayPlus return the original operation or create a second ₪15 charge? If there is no idempotency key, confirm which lookup is authoritative before any retry.
4. **PAN-free membership refunds.** Confirm a refund of the captured ₪15 can be full or partial, more than once, with no CVV and no card number, and that partial refunds cannot exceed the captured fee.
5. **Sandbox host.** Confirm Perkly’s membership test keys work only on `https://restapidev.payplus.co.il`, live keys are rejected there, and the hosted page URL returned in staging is not a live host. Staging must reject `https://restapi.payplus.co.il` and live keys.
6. **Invoice+.** Confirm Invoice+ will issue the membership document in Perkly’s legal name and tax id for ₪15, including a refund document. This is not a document for a merchant product sale.
7. **Chargeback export.** Ask how chargebacks, deadlines, and outcomes on Perkly’s membership account will be exported for import.

Also:

- If PayPlus cannot provide an importable chargeback feed, or a membership refund needs a card number or CVV, stop. Cardcom is the runner-up only for the membership charge, and only on the D-22 conditions.
- Record the written answers in `PAYMENT_CONTRACT.md`. Do not send secret keys in chat.
- Hosted payment page only. Perkly never sees PAN or CVV.

## E02. Provider sandbox, then live onboarding

**Ready when:** Sandbox credentials for Perkly’s membership account are stored securely. A live Perkly membership account and written permission for a small membership test wait until a later phase. No merchant seller account is required.

**Readiness:** Pending. Depends on E01.

**Blocks completion of:** A later membership sandbox test. It does not unblock Phase 05.

**Steps:**

1. After E01, create the PayPlus sandbox application for Perkly’s membership terminal only. Staging may call only `https://restapidev.payplus.co.il`.
2. Store sandbox secrets in the approved secret store. Record only the reference names and the sandbox hostnames.
3. Keep sandbox and live credentials and hosts distinct. Staging must be unable to charge live.
4. Do not onboard a merchant PayPlus terminal. Do not authorize a live merchant-sale charge. A live membership test is not authorized now.

## E03. AWS account, region, domain, and cost approval

**Ready when:** MFA and recovery contacts exist, SSO or deploy access is defined, staging and production isolation is chosen, the domain and DNS are controlled, a regional certificate can be issued, and a spend estimate has been reviewed.

**Readiness:** Pending. No account is attached. No billable resource may be created from Phase 00.

**Blocks completion of:** P10-01.

**Steps:**

1. Open or designate the AWS account or accounts, with billing, MFA, and recovery contacts.
2. Prefer separate staging and production accounts. If one account is used, write down the isolation rules before any deploy.
3. Verify current regional availability for RDS, ECS, Cognito, SES, S3, CloudFront, Secrets Manager, and Bedrock before locking a region. `il-central-1` is a proposal (O-12), not a decision. The AI region may differ only after a data-processing review.
4. Register or delegate the domain and be able to edit DNS.
5. Review NAT, load balancer, WAF, database, backup, and data-transfer costs. A budget alarm is not a spending cap. Approve a spend estimate before Phase 10 deploys anything.
6. Do not put access keys in chat or in the repository. Phase 10 uses temporary OIDC credentials (E09).

## E04. Email and support

**Ready when:** The sending domain is verified in DNS, SES access and limits are known, Cognito email is configured, a monitored support mailbox exists, and bounce and complaint events have a destination.

**Readiness:** Pending.

**Blocks completion of:** P09-03, and hosted email in P10-03.

**Steps:**

1. Choose the visible From domain and the support mailbox.
2. Verify the domain for SES and request production sending access if the account is still in a sandbox limit.
3. Point Cognito's verification mail at the approved identity when pools exist.
4. Route bounces and complaints to a place an operator watches.
5. Local development uses an outbox and does not send real mail. Do not authorize live sends from Phase 00.

## E05. Legal and accounting decisions

**Ready when:** Merchant and consumer terms, recurring billing, cancellation, and refund policies, privacy and retention, tax and document issuer, reference-price practice, and accessibility obligations are approved.

**Readiness:** Pending. No policy version is published.

**Blocks completion of:** P07-05 and P09-05. Category exclusions also block any narrowing of the 3% benefit (D-10, O-08).

**Steps:**

1. Approve customer terms, merchant terms, and the privacy notice, each with a version label and URL.
2. Approve recurring-consent, cancellation, and refund wording, including what happens to access after a fee refund.
3. Invoice+ on Perkly’s legal name is the path for the ₪15 membership document (E01 question 6). Perkly does not issue the merchant’s product-sale document. Perkly still needs an accountant to file VAT and to confirm the membership document type. An order summary is not a tax document. E05 is not complete.
4. Approve how reference prices are evidenced before an offer is published.
5. Approve retention for profiles, logs, support, tax documents, and financial history, including copies in Cognito, S3, backups, and the provider.
6. If any purchase category cannot receive the extra 3%, publish that exclusion. Until then, no silent exclusion is allowed.
7. Record accessibility obligations that the Hebrew, Arabic, and English flows must meet.

## E06. Native-language review and merchant material

**Ready when:** Hebrew and Arabic wording is reviewed by native speakers, and real merchants have supplied identity, photos and rights, genuine prices, stock allocations, pickup terms, and branch facts.

**Readiness:** Pending. Fictional local fixtures, when Phase 01 creates them, are not this material.

**Blocks completion of:** P09-01 and P09-05 for launch copy, and the real pilot catalogue.

**Steps:**

1. Have native speakers review membership, cancellation, refund, and payment-pending wording in Hebrew and Arabic, and check RTL layout of amounts and consent.
2. Collect each pilot merchant's legal name, branch address, timezone, photos with usage rights, real prices, Perkly stock allocations, and pickup terms.
3. Collect branch facts with a source and a date. A merchant cannot mark its own sentence as independently verified by Perkly.
4. Do not send KYC document files to the coding agent.

## E07. Bedrock activation and permitted processing

**Ready when:** A model, inference profile, and region are chosen from what the account actually offers, access is scoped, and paid evaluation is authorized.

**Readiness:** Pending. No model ID is guessed.

**Blocks completion of:** P08-03 and P08-04. Ordinary SQL discovery (P08-02) does not need Bedrock.

**Steps:**

1. Enable Bedrock in the reviewed region.
2. List models that support structured output. Pick one from that list and record the ID, profile, and region in `DECISIONS.md`, closing O-11.
3. Create a scoped role for that model only.
4. Authorize a paid evaluation budget before P08-04. Record cost from real calls. Do not treat a hand-written model response as an evaluation.
5. Confirm that query text and UI language are the only fields sent, and that raw queries are not logged.

## E08. Operating, review, and release ownership

**Ready when:** Alarm recipients are real people, support coverage is named, an independent security reviewer is named, incident escalation is written, and Anas has approved the exact live test and rollout for a specific build.

**Readiness:** Pending. There is no build to approve.

**Blocks completion of:** P10-05, P11-02, and any launch decision.

**Steps:**

1. Name the people who receive payment, worker, and availability alarms, and prove they received a test alarm in Phase 10.
2. Name support coverage for the pilot.
3. Name an independent security reviewer who is not the person who wrote the change.
4. Write the escalation path for unknown payments, privacy requests, and a bad release.
5. Approve a specific image digest, configuration, rollout scope, and recovery plan only after the evidence in `RELEASE_GATES.md` exists. That approval is not available now.

## E09. Repository and CI

**Ready when:** A repository is chosen, branches and environments are protected, an authorized deploy identity exists, and release evidence has a retention place.

**Readiness:** Pending. The application repository is https://github.com/anasha-dot/perkly and P01-01 is on branch `perkly/foundation`. Branch protection, environments, and a deploy identity are not set. Do not push secrets.

**Blocks completion of:** P10-02 for protected release CI and OIDC deploy.

**Steps:**

1. The git repository exists and was not imported from an older Perkly source archive. Protect the default branch when you are ready.
2. Protect the default branch and the staging and production environments.
3. Configure a GitHub or equivalent OIDC role for deploy. Do not create long-lived AWS access keys for CI.
4. Decide where sanitized evidence and release manifests are kept (`docs/evidence/` and `docs/releases/` are the reserved paths). Those directories have no results in them today.

## Current summary

| ID | Readiness | Next owner action |
| --- | --- | --- |
| E01 | Pending | Send PayPlus the seven membership questions in this file. Do not ask about a merchant sale. Approval is not done. |
| E02 | Pending | After E01, open a sandbox. Do not open live charges. |
| E03 | Pending | Designate accounts, region check, domain, and a spend review. |
| E04 | Pending | Choose the support mailbox and sending domain. |
| E05 | Pending | Commission the terms, tax, and retention decisions. |
| E06 | Pending | Plan Hebrew and Arabic review and the first real merchant pack. |
| E07 | Pending | After an AWS account exists, list Bedrock models. Do not guess an ID. |
| E08 | Pending | Name operators and a reviewer before any hosted launch work. |
| E09 | Pending | Protect branches and name the deploy identity. The GitHub repository exists. |

E01 stays pending. Selecting PayPlus for membership is not approval. A sandbox login, a domain, or an unanswered membership question does not complete it.
