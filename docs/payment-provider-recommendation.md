---
cursor:
  subagentId: "bc-53dc1df9-beeb-59ce-a2f8-71e10a07389e"
---

**Status, 20 October 2026.** Merchant use of this recommendation is withdrawn (D-22). Perkly does not use PayPlus, or any provider, to charge, capture, refund, or settle a merchant product sale. There is no merchant PayPlus terminal. The research below remains the record and is not rewritten. PayPlus remains the provider for the ₪15 membership only, on Perkly’s own account and terminal. That membership decision is D-22 in `DECISIONS.md`, not a finding of the research below.

# Payment provider recommendation

**Winner: PayPlus.** **Runner-up: Cardcom.**

Checked against primary documentation on 20 October 2026. Fees, request fields, and country coverage below are only what those pages state. Where a page does not say, the answer is unknown.

Perkly’s launch rule is two separate settlements, not a split of one sale. A product payment is for one business and must settle to that business’s own account. Perkly takes no sales commission. The optional membership is ₪15 on the provider’s own billing anchor and must settle to Perkly’s separate account. Checkout is hosted. Perkly must not see a card number or CVV.

## Why PayPlus

PayPlus documents a hosted payment page, a recurring object that PayPlus itself charges, a transaction lookup, partial refund by transaction id, deposit lists, and Invoice+ tax documents. Staging and production are different hosts, so staging can refuse live credentials.

Use one PayPlus account per legal entity:

- Each pilot merchant uses that merchant’s API key, secret, `terminal_uid`, and payment page. The sale deposit belongs to that terminal.
- Perkly uses a second account and terminal only for the ₪15 membership.

The public API does not show a platform fee on `PaymentPages/GenerateLink`. It also does not contain a sentence that says the deposit is paid into that merchant’s bank. That confirmation is an E01 question, not an assumed fact.

### What the PayPlus docs already show

| Need | Documented behavior |
| --- | --- |
| Hosted checkout | `PaymentPages/GenerateLink` returns a payment-page link. Calls must be made from Perkly’s server. Charge method `1` is an immediate charge. Charge method `3` is recurring. |
| ILS | `ILS` is a documented currency. Generate Link defaults to ILS. |
| Amount | The API uses a decimal shekel amount, not integer agorot. Perkly keeps agorot and sends an exact two-decimal shekel value. |
| 3DS | Generate Link accepts a `secure3d` object. Omitting it uses the page default. |
| Lookup | `Transactions/View` can search by `transaction_uid` or `more_info`. `PaymentPages/ipn` can search by `payment_request_uid`, `transaction_uid`, or `more_info`. A browser return is not the record. |
| Recurring | `recurring_type` `2` is monthly. `recurring_range` defaults to `1`. `number_of_charges` `0` means unlimited. `start_date` cannot be today. `POST /RecurringPayments/{uid}/Valid` with `valid: false` means it will not be charged. Charge history is paged, with `take` at most 500. `RecurringPaymentsReports/Failures` lists failures by date. |
| Refund | `Transactions/RefundByTransactionUID` requires `transaction_uid` and `amount`, and the amount must not exceed the original transaction. The text also calls that original transaction a J5 approval. Partial amount is mentioned for the invoice line. CVV is not required by the schema, but the description says the call fails if that credit-company terminal requires CVV. Cancel is only before deposit, documented default 23:00; after that, use refund. |
| Deposits | `Deposit/list` and `Deposit/view` are per `terminal_uid`, date range, and optional currency, with `skip` / `take` up to 500. The published success example is an empty object, so fee and net fields are not specified. |
| Webhooks | A callback URL receives successful charge and refund details. `send_failure_callback: true` also requests failures. The validation guide says to check `user-agent: PayPlus` and a base64 HMAC-SHA256 `hash` of the JSON body using the secret. Its worked example is a Generate Link response, not a callback body. |
| Sandbox | Staging base URL `https://restapidev.payplus.co.il/api/v1.0/`. Production base URL `https://restapi.payplus.co.il/api/v1.0/`. Test card numbers are published. Staging must allow only the staging host and staging keys. |
| Invoices | Invoice+ document codes include `inv_tax` (type code 305, labeled Tax invoice), `inv_tax_receipt` (320, Tax invoice/receipt), `inv_receipt` (400, Receipt), and `inv_refund` (330, Refund). A document can be tied to a transaction UUID. |

The later Node adapter can be a thin client over this JSON API: store the stable ids, look up an unknown call before creating another one, and never call the direct charge, direct card-refund, or Wittix card endpoints. Those card endpoints are outside the hosted rule. This recommendation does not design that adapter.

### Invoices

PayPlus can issue the tax document when Invoice+ is enabled on the account that owns the API key. A merchant sale document must be issued on the merchant’s PayPlus account, in that merchant’s legal name and tax id. The membership document must be issued on Perkly’s account. Morning or iCount is not required for that path.

A merchant who will not enable Invoice+ still needs Morning, iCount, or an accountant to issue the sale document. Perkly still needs an accountant to file VAT and to choose the legal document type. PayPlus also documents an optional connection to an outside invoice company. That connection is not required if Invoice+ is the issuer.

### Fees

Unknown. No PayPlus page reviewed on 20 October 2026 publishes card-acquiring rates. The public contact and onboarding pages say a quote is prepared for the account. Do not treat affiliate reward figures on the PayPlus partner page as acquiring fees.

### What PayPlus has not published

- An idempotency key. `more_info` is a lookup field. Repeating Generate Link after a timeout is not documented as returning the same charge.
- A chargeback or dispute resource. The API index has deposits, refunds, and recurring failure reports, and no dispute feed.
- The deposit payload. List and view exist; the example response does not show gross, fee, or net.
- Proof that the callback uses the same `hash` header as the validation example.
- Proof that `RefundByTransactionUID` refunds a captured hosted sale, more than once, with no CVV.
- The calendar rule for a monthly anchor on the 29th, 30th, or 31st.

## Runner-up: Cardcom

Cardcom can also do the two-account model. Its Low Profile page says the terminal number and API user “must be obtained from the business.” Perkly would use the merchant’s terminal for a sale and Perkly’s terminal for membership.

Cardcom documents a hosted page, a webhook that must be checked with `LowProfile/GetLpResult`, `ReturnValue` as the order reference, `Do3DSAndSubmit`, refund by transaction id with `PartialSum` and `AllowMultipleRefunds`, and `Transactions/SpecialTransactions` for chargebacks, subscription-cancellation notices, and non-delivery notices. Its recurring interface can create a standing order and names a tax-invoice document type. The v11 amount is a decimal shekel amount such as `100.50`.

Cardcom is second because the documented test terminal `1000` is on the production host `https://secure.cardcom.solutions`. Staging can refuse a live terminal number and password. It cannot refuse a separate live host, because no separate host is documented. The API is also split between older name-value pages and newer JSON articles, which is a weaker contract for the later Node adapter than PayPlus.

## Rejected

**Stripe.** Israel is not one of the countries on [stripe.com/global](https://stripe.com/global). The registration links on that page were checked on 20 October 2026 and do not include `IL`. Stripe’s payout guide says an Israeli bank account is only available for cross-border payout accounts. Self-serve cross-border payouts are limited to platforms in the US, UK, EEA, Canada, and Switzerland. Global Payouts can send ILS to an Israeli recipient from a US or UK sender. That is a payout product, not Israeli card acquiring into a merchant account plus a Perkly recurring charge.

**Grow (Meshulam).** Grow does have a sandbox host, a per-business `userId`, and a recurring payment that can be cancelled. Its refund guide blocks the required refund behavior: a same-day reversal cancels only the whole transaction, the API allows at most two refunds, and no invoice is generated for a refund.

**Tranzila.** Tranzila documents hosted payment links, HMAC-signed API requests, transaction reports, provider-run standing orders, and Israeli invoice types including חשבונית מס and קבלה. The published card transaction schema still marks `card_number` as required, and the credit example sends a card number and CVV. There is no documented partial refund by reference that keeps the card number and CVV off Perkly’s server.

**Hyp Pay.** Hyp Pay documents a hosted page, provider-run monthly billing (`HK=True`, `freq=1`), partial refund by transaction id without a card number, 3DS, and tax invoices or receipts through Hyp Invoice (formerly EZcount). Completion is a browser redirect. The documented verify call needs every redirect parameter, including `Sign`. No server webhook and no lookup by order id alone are documented, so a closed tab has no documented recovery.

**Hyp Enterprise (CreditGuard).** Hyp Enterprise documents hosted pages, amounts in agorot, SNS webhooks, paged transaction inquiry, partial refund, and EZcount tax documents. It does not run the membership calendar. The standing-order page says the application must send later charges, and that Hyp Enterprise has no command to terminate the standing order.

**Rapyd.** Rapyd’s marketplace page says the payment lands in the platform’s Rapyd wallet, the seller’s share lands in a sub-account, and the platform can hold funds. That is platform custody. The roadmap leaves custody for later.

**BlueSnap.** BlueSnap Marketplace is documented as available in Israel. A sale is split by the commission submitted with the capture, and BlueSnap pays the vendor. The platform account receives the commission split, and a vendor-management fee is described. That is not a no-commission charge on the merchant’s own acquiring account plus a separate Perkly membership account.

**PayMe.** The PayMe reference lists merchants, hosted pages, subscriptions, refunds, withdrawals, and separate sandbox and production URLs. On 20 October 2026 those pages did not return the request or settlement text, so merchant settlement and a separate Perkly subscription were not verified. PayMe is not selected.

## Questions Anas must close before E01

Send these to PayPlus and keep the written answers with the provider approval:

1. **Settlement accounts.** Can Perkly open a hosted sale with the merchant’s API key, `terminal_uid`, and payment page so that deposit is paid only to that merchant’s bank account, while the ₪15 membership uses Perkly’s different terminal and bank account? Confirm Perkly does not receive the sale and does not take a commission.
2. **Who bears acquiring fees.** Confirm sale fees are deducted on the merchant’s deposit and membership fees are deducted on Perkly’s deposit. Send the rate card. No public rate was found.
3. **Recurring interval.** For monthly `recurring_type` 2 and `recurring_range` 1, what day is charged, including the 29th, 30th, 31st, and 29 February, in Asia/Jerusalem? Confirm it is not a fixed 30-day period and not forced to the first of the month. Confirm `number_of_charges` 0 stays open until `Valid` is false, a failed renewal creates no paid period, and the failure appears in `RecurringPaymentsReports/Failures`.
4. **Idempotency.** If Generate Link or create-recurring is repeated after a timeout with the same `more_info`, does PayPlus return the original operation or create a second charge? If there is no idempotency key, confirm that lookup by `more_info` and `payment_request_uid` is authoritative before any retry.
5. **Refunds.** Confirm `RefundByTransactionUID` refunds a captured hosted sale, full and partial, more than twice, with no CVV and no card number. Confirm cancel-before-deposit versus refund-after-deposit, and that several partial refunds cannot exceed the capture. Confirm the same call refunds a membership fee on Perkly’s terminal.
6. **Sandbox.** Confirm staging keys and test cards work only on `restapidev.payplus.co.il`, live keys are rejected there, and the hosted page URL returned in staging is not a live host. Confirm 3DS success and failure can be tested. Staging must reject `restapi.payplus.co.il` and live keys.
7. **Israeli invoices.** Confirm Invoice+ will issue חשבונית מס/קבלה (`inv_tax_receipt`, type 320), or the type the accountant requires, in the merchant’s legal name and tax id for a sale and in Perkly’s legal name and tax id for ₪15. Confirm `inv_refund` (330) is issued for a partial or full refund. Confirm a merchant who does not enable Invoice+ must use Morning, iCount, or an accountant.
8. **Chargebacks and callback proof.** The public index has no dispute API. Ask how chargebacks, deadlines, and outcomes will be exported for import. Also confirm server callbacks carry the documented `hash` header and `user-agent: PayPlus`.

E01 is not done until those answers are written down. The local payment simulator does not need them.

## Sources

All checked 20 October 2026.

- PayPlus REST API environment URLs — https://docs.payplus.co.il/reference/payplus-rest-api-urls
- PayPlus API index — https://docs.payplus.co.il/reference/llms.txt
- PayPlus website or app, including hosted charge methods — https://docs.payplus.co.il/reference/website-or-app
- PayPlus Generate Payment Link — https://docs.payplus.co.il/reference/post_paymentpages-generatelink
- PayPlus validate requests — https://docs.payplus.co.il/reference/validate-requests-received-from-payplus
- PayPlus transaction callback — https://docs.payplus.co.il/reference/get_yourdomain-yourendpoint
- PayPlus PaymentPages IPN lookup — https://docs.payplus.co.il/reference/post_paymentpages-ipn
- PayPlus Transactions View — https://docs.payplus.co.il/reference/post_transactions-view
- PayPlus sandbox cards — https://docs.payplus.co.il/reference/sandbox-credit-card-numbers
- PayPlus recurring add — https://docs.payplus.co.il/reference/post_recurringpayments-add
- PayPlus recurring Valid — https://docs.payplus.co.il/reference/post_recurringpayments-uid-valid
- PayPlus recurring charges list — https://docs.payplus.co.il/reference/get_recurringpayments-uid-viewrecurringcharge
- PayPlus recurring failures — https://docs.payplus.co.il/reference/get_recurringpaymentsreports-failures
- PayPlus refund by transaction UID — https://docs.payplus.co.il/reference/post_transactions-refundbytransactionuid
- PayPlus cancel transaction — https://docs.payplus.co.il/reference/post_transactions-cancel
- PayPlus deposit list — https://docs.payplus.co.il/reference/get_deposit-list
- PayPlus document types — https://docs.payplus.co.il/reference/get_books-doc-types
- PayPlus search documents — https://docs.payplus.co.il/reference/get_books-docs-list
- PayPlus recurring product page — https://www.payplus.co.il/recurring-payments
- Cardcom Low Profile create and GetLpResult — https://support.cardcom.solutions/apijosn/he/articles/459/step-1-2-creating-a-payment-page-sending-a-request-to-retrieve-transaction-details-iframe-redirect
- Cardcom refund by transaction id — https://support.cardcom.solutions/apijosn/he/articles/456/partial-full-transaction-refund-by-transaction-id-refund-by-transaction-id
- Cardcom special transactions — https://support.cardcom.solutions/apijosn/he/articles/518/%D7%A7%D7%91%D7%9C%D7%AA-%D7%9E%D7%99%D7%93%D7%A2-%D7%A2%D7%9C-%D7%94%D7%9B%D7%97%D7%A9%D7%95%D7%AA-%D7%A2%D7%A1%D7%A7%D7%94-%D7%91%D7%99%D7%98%D7%95%D7%9C-%D7%9E%D7%A0%D7%95%D7%99-%D7%95%D7%9B%D7%A9%D7%9C-%D7%AA%D7%9E%D7%95%D7%A8%D7%94-%D7%94%D7%95%D7%93%D7%A2%D7%95%D7%AA-%D7%A1%D7%9C%D7%99%D7%A7%D7%94-special-transactions
- Cardcom recurring API — https://support.cardcom.solutions/apinametovalue/he/articles/559/%D7%94%D7%95%D7%A8%D7%90%D7%AA-%D7%A7%D7%91%D7%A2-%D7%91-api-%D7%99%D7%A6%D7%99%D7%A8%D7%AA-%D7%94%D7%95%D7%A8%D7%90%D7%AA-%D7%A7%D7%91%D7%A2-%D7%91%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-%D7%A7%D7%90%D7%A8%D7%93%D7%A7%D7%95%D7%9D-direct-debit-api
- Stripe global availability — https://stripe.com/global
- Stripe receive payouts — https://docs.stripe.com/payouts
- Stripe cross-border payouts — https://docs.stripe.com/connect/cross-border-payouts
- Stripe Global Payouts recipient requirements — https://docs.stripe.com/global-payouts/recipient-requirements
- Grow refund overview — https://developers.grow.business/reference/refund-overview
- Grow testing environment — https://developers.grow.business/reference/testing-environment
- Tranzila create credit-card transaction — https://docs.tranzila.com/docs/payments-and-billing/tranzila-api/create-a-credit-card-transaction
- Tranzila invoices API — https://docs.tranzila.com/docs/invoices/invoices-api
- Hyp Pay recurring payments — https://developers.hyp.co.il/pay/advanced-features/recurring-payments
- Hyp Pay transaction validation — https://developers.hyp.co.il/pay/security/transaction-validation
- Hyp Pay testing environments — https://developers.hyp.co.il/pay/getting-started/testing-environments
- Hyp Enterprise standing orders — https://developers.hyp.co.il/enterprise/recurring-payments-and-subscriptions/horaat-keva
- Rapyd marketplaces — https://www.rapyd.net/solutions/industries/marketplaces/
- BlueSnap Marketplace FAQs — https://support.bluesnap.com/docs/faqs-marketplace
- PayMe sandbox and production URLs — https://docs.payme.io/docs/payments/v4n3lbk5v9qpj-sandbox-and-production-ur-ls

## What would change the recommendation

Switch away from PayPlus if PayPlus will not settle a hosted sale to the merchant’s own bank account, or if it requires the sale to land in Perkly’s account.

Switch to Cardcom if PayPlus cannot provide a chargeback export Perkly can import, and Cardcom confirms `SpecialTransactions` plus a sandbox host that is not `secure.cardcom.solutions`.

Switch away from PayPlus if a captured-sale refund requires a card number or CVV.

Switch the invoice plan, not necessarily the acquirer, if Invoice+ cannot issue the accountant’s required document in the seller’s own tax id. The merchant or Perkly would then use Morning, iCount, or the accountant for that document.

Reopen Stripe only if Israel is added to `stripe.com/global` and Stripe documents Israeli card acquiring, direct settlement to an Israeli merchant account, and a separate ILS Billing subscription to Perkly.

Reopen PayMe, Rapyd, or BlueSnap only if their own docs show a zero-commission sale that settles to the merchant without a platform wallet or commission split, plus a separate Perkly recurring charge, with hosted checkout, lookup, partial refunds, disputes, statements, and a distinct sandbox host.

## 15-line summary

Use PayPlus for the Kfar Manda pilot.
Give each merchant a PayPlus terminal for product sales, and give Perkly a different terminal for the ₪15 membership.
Take no commission on a sale, and do not collect a card number or CVV. Use the hosted payment page only.
Point staging only at restapidev.payplus.co.il, and reject the production host and live keys.
Bill membership monthly on PayPlus’s start date. Stop future charges with Valid set to false.
Treat a browser return as untrusted. Confirm the result with Transactions/View or PaymentPages/ipn.
Use Invoice+ on the seller’s own account for the tax invoice/receipt and for the refund document.
A merchant who will not enable Invoice+ still needs Morning, iCount, or an accountant. Perkly still needs an accountant to file VAT.
Acquiring fees are not published. Get PayPlus’s written quote before E01.
Before E01, get written answers on settlement banks, who pays fees, the monthly charge day, idempotency, PAN-free refunds, the sandbox, and Invoice+.
PayPlus publishes no chargeback API. Ask for an importable feed.
If PayPlus cannot provide that feed, Cardcom is the backup: it documents chargebacks, partial refunds, tax invoices, and hosted checkout, but its test terminal is on the live host.
Do not use Stripe, Grow, Tranzila card refunds, Hyp Enterprise scheduling, Hyp Pay without a server lookup, Rapyd wallets, or BlueSnap sale splits.
Keep Perkly amounts in integer agorot. PayPlus amounts are shekels with two decimals.
Do not start the live adapter until the E01 answers are filed. The local simulator can proceed.
