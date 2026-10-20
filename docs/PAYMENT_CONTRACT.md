# Perkly payment contract

**Status:** Prepared checklist only. D-22, 20 October 2026. PayPlus is the membership provider only. Provider approval is E01 and is not done.
**This is not:** PayPlus approval, a finished adapter, a sandbox result, or permission to charge or refund money.

Perkly does not process, capture, refund, or settle the payment between the customer and the merchant. There is no merchant PayPlus terminal. Do not use PayPlus, or any provider, for a merchant product sale. A code activates the discount. The merchant charges the customer on the merchant’s own till, outside Perkly. Code mechanics are O-15 and are not specified here.

PayPlus is used only for the ₪15 membership, on Perkly’s own account and terminal, through a hosted payment page. Perkly never sees PAN or CVV. Cardcom is the runner-up only for that membership charge, and only on the D-21 conditions restated in D-22. Research in `payment-provider-recommendation.md` remains the record. Merchant use of that research is withdrawn. The operation names below are internal Perkly capabilities. They are not PayPlus endpoint names. No row is confirmed by PayPlus.

Related: `DECISIONS.md` D-22, `OWNER_SETUP.md` E01 and E02.

## 1. What "done" means for this checklist

P00-02 is complete as a checklist. That completion does not approve PayPlus. E01 is ready only when PayPlus answers the membership questions in `OWNER_SETUP.md` and the non-secret answers are written back here. Those questions do not ask PayPlus to settle a merchant sale.

Still open for the membership account: fees on that deposit, the recurring charge day, idempotency, PAN-free membership refunds, sandbox proof, Invoice+ on Perkly’s legal name for the ₪15, and a chargeback export.

## 2. Funds flow

| Step | What is decided | Confirmed by PayPlus |
| --- | --- | --- |
| Merchant product sale | Outside Perkly. The merchant’s own till charges the customer. No PayPlus merchant terminal. No Perkly capture, refund, or settlement. | Not a PayPlus question. Do not ask it. |
| Discount | A code activates the discount. Format, expiry, single-use, merchant confirmation, and savings verification are open. | Not a PayPlus question. |
| Membership | Perkly charges ₪15 inside the app on Perkly’s own PayPlus account and terminal. Hosted page only. Perkly never sees PAN or CVV. | Account choice is locked. Approval is open. |
| Platform commission | None on a sale. | Settled. There is no sale commission to configure. |
| Amounts | Perkly stores integer agorot. A membership charge, when sent, is the exact two-decimal amount 15.00 shekels. | Design locked. Adapter not built. |
| Membership collection fees | Perkly bears them under the PayPlus agreement. | No rate card. E01. |
| Membership fee refund | A refund of the ₪15 is a Perkly-account fact. It does not by itself revoke access. It must not require PAN or CVV. | Not proved. E01. |
| Membership tax document | Invoice+ on Perkly’s legal name for the ₪15. Perkly does not issue the merchant’s sale document. | Not confirmed. E01. VAT filing remains with Perkly’s accountant. |
| Membership chargebacks | An importable export is required before E01 is done. A dispute does not erase the original membership charge. | No export on file. |
| Membership statements | Fee lines on Perkly’s deposit can be reconciled once PayPlus documents them. | Not confirmed. |
| Merchant settlement | Deferred. Do not import a merchant-sale settlement. | Not applicable. |
| Environments | A future membership call from staging may use only `https://restapidev.payplus.co.il`. `https://restapi.payplus.co.il` and live keys are refused there. | Host rule locked. Sandbox proof is not done. |

## 3. Internal capabilities

Merchant sale operations are out of scope. Do not implement `createCheckout` or `createRefund` for a merchant product payment.

| Internal capability | Required behavior | Mapped |
| --- | --- | --- |
| Merchant sale checkout, refund, or settlement | Do not build. `deferred_by_owner`. | No |
| `createMembershipAgreement` | Start a hosted recurring agreement for a stable reference, the Perkly account, 1500 agorot, and recorded consent. | No |
| `getMembershipAgreement` | Look up that same reference. | No |
| `cancelRenewal` | Stop future renewal without deleting paid-period history. | No |
| `listVerifiedMembershipInvoices` | Page invoices. Only a verified paid invoice grants a period or a fee. | No |
| `createMembershipRefund` | Refund the membership charge on Perkly’s account, with no PAN and no CVV. | No |
| `getMembershipRefund` | Look up that refund. Unknown does not allow another refund of the same fee. | No |
| `listMembershipFinancialEvents` | Page membership refunds, disputes, and chargebacks. Not merchant-sale events. | No |
| `listMembershipStatements` | Page Perkly’s membership deposit. Not a merchant settlement. | No |
| `verifyAndNormalizeWebhook` | Authenticate a membership callback the way PayPlus’s approved docs specify. | No |

These names are Perkly’s. They are not a claim that PayPlus publishes endpoints with these names.

## 4. Capability checklist

| # | Question | Answer |
| --- | --- | --- |
| C01 | Merchant-sale settlement through PayPlus | Withdrawn. Do not ask. |
| C02 | ₪15 on Perkly’s own terminal | Design locked by D-22. Not approved. |
| C03 | Recurring day, including the 29th, 30th, 31st, and 29 February, in Asia/Jerusalem. Not a fixed 30 days and not forced to the first of the month. | Open. |
| C04 | PAN-free refund of the membership fee, full and partial, without exceeding the captured fee. | Open. |
| C05 | Importable chargeback export and deadlines for the membership account. | Open. |
| C06 | Membership deposit fee lines. | Unknown. |
| C07 | Idempotency of the membership create. | Open. |
| C08 | What a temporary lookup miss means for a membership charge. | Unknown. A miss must not create a second charge. |
| C09 | Membership callback authentication. | Open. |
| C10 | Hosted page only, no PAN or CVV. | Locked for membership. Not an approval. |
| C11 | Staging host `https://restapidev.payplus.co.il` only. Production host and live keys refused. | Host rule locked. Sandbox proof open. |
| C12 | Merchant PayPlus role | None. Do not provision a merchant terminal. |
| C13 | A repeated membership create must not become a second charge. | Open with C07. |
| C14 | Pause new memberships without blocking lookup, fee refund, cancellation, or membership reconciliation. | Required behavior. Not tested. |
| C15 | Invoice+ on Perkly’s legal name for the ₪15. | Open. Not the merchant’s sale document. |
| C16 | Fees deducted on Perkly’s membership deposit. | Open. No rate card. |

## 5. Normalized states

These states are for the membership charge only. Do not use them to mark a merchant sale paid.

| Provider status | Perkly membership charge | Mapping |
| --- | --- | --- |
| Not supplied | `creating` | Unmapped |
| Not supplied | `pending` | Unmapped |
| Not supplied | `captured` | Unmapped. Authorization without capture must not land here. |
| Not supplied | `failed` | Unmapped |
| Not supplied | `cancelled` | Unmapped |
| Not supplied | `unknown` | Unmapped. |

| Provider status | Membership refund | Mapping |
| --- | --- | --- |
| Not supplied | `processing` | Unmapped |
| Not supplied | `unknown` | Unmapped. Does not allow another refund of the same fee. |
| Not supplied | `succeeded` | Unmapped |
| Not supplied | `failed` | Unmapped |

Subscription names remain `pending`, `active`, `past_due`, `cancellation_pending`, `cancellation_scheduled`, `ended_revoked`, and `failed`. O-07 still forbids inventing the difference between the two cancellation names. A paid period comes only from a verified paid invoice. Pending checkout grants no paid access.

## 6. Idempotency and unknown outcomes

These rules apply to the membership charge. They are not a merchant-sale integration.

- The same stable reference, amount, and Perkly account mean one membership operation.
- The same reference with a different amount or account is a conflict.
- A refund or cancellation timeout stays a tracked operation with an owner.
- Lookup runs before a retry of the same provider mutation.
- Provider calls are not made inside a database transaction that may automatically retry.
- A browser return does not grant a paid period.
- Staging may call only `https://restapidev.payplus.co.il`. It must reject `https://restapi.payplus.co.il` and live keys.
- New memberships can be paused while lookup, fee refund, cancellation, and membership reconciliation continue.

## 7. Required documentation

| Document | Why | On file |
| --- | --- | --- |
| Approved reference for the hosted membership page, lookup, and fee refund | P06-02 may only call documented operations | No |
| Recurring agreement, invoice list, and cancellation reference | P06-02 and P06-03 | No |
| Webhook authentication for membership callbacks | Membership recovery | No |
| Idempotency rules for the membership create | Prevents a second ₪15 charge | No |
| Lookup-miss behavior | C08 | No |
| Membership deposit, fee, and chargeback export | E01 | No |
| Sandbox versus live host guide for Perkly’s account | No merchant seller account | No |
| Hosted-page security checklist | PAN and CVV stay off Perkly | No |
| Fee schedule for the membership deposit | E01 | No |
| Invoice+ behavior in Perkly’s legal name for ₪15 | E01 | No |

## 8. Outside inputs

| Input | Source | Blocks | State |
| --- | --- | --- | --- |
| Membership provider | Anas Hallumi, D-22 | None for the choice | PayPlus, membership only |
| Membership E01 answers | Anas Hallumi | P06-02 | Pending. Not a merchant-sale approval. |
| Sandbox secret for Perkly’s membership account | E02 | A later membership sandbox test | Pending. No merchant test terminal. |
| Invoice+ on Perkly’s legal name | E01 and E05 | The membership tax document | Pending |
| Staging host | D-22 | Any future membership call | `https://restapidev.payplus.co.il` only |

P05-01 is not the launch path. A local merchant-sale simulator is `deferred_by_owner`.

## 9. Non-secret facts

| Fact | Value |
| --- | --- |
| Provider for membership | PayPlus |
| Provider for merchant product sales | None |
| Runner-up, membership only | Cardcom, only on the D-22 conditions |
| Research record | `payment-provider-recommendation.md`. Merchant use withdrawn. Body not rewritten. |
| Public documentation index | https://docs.payplus.co.il/reference/llms.txt |
| Staging host | `https://restapidev.payplus.co.il` only |
| Production host in staging | Refused. Documented host `https://restapi.payplus.co.il` is not approved for use. |
| Merchant settlement | Withdrawn. Do not confirm it with PayPlus. |
| Membership terminal | Perkly’s own. Not approved. |
| Billing-anchor description | |
| Membership collection fees | |
| Idempotency behavior | |
| PAN-free membership refund | |
| Chargeback export | |
| Invoice+ on Perkly’s legal name | |
| Secret reference names | |

## 10. Prohibited

- Charging, capturing, refunding, or settling a merchant product sale through PayPlus or any other provider.
- Creating a merchant PayPlus terminal.
- Treating Phase 05 as the launch path.
- Implementing the membership adapter before the E01 answers are filed.
- Calling any payment host from staging except `https://restapidev.payplus.co.il`.
- Sending PAN or CVV to Perkly.
- Putting card numbers, CVV, or live secrets in the repository, this file, or chat.
- Treating this checklist, the recommendation, or a browser redirect as provider approval.
- Marking a provider release gate complete.
