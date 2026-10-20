# Perkly product specification

**Status:** Product contract. P01-01 added a local shell. No database and no payment integration exist.
**Source:** `Perkly_From_Scratch_Roadmap.md` version 1.0, 20 October 2026. This file records the product contract. It does not replace the roadmap.
**Owner:** Anas Hallumi. Recorded 20 October 2026.
**Related:** `DECISIONS.md` D-22, `PAYMENT_CONTRACT.md`, `ARCHITECTURE.md`, `API.md`.

**Payment model (D-22, 20 October 2026):** Perkly does not process, capture, refund, or settle the payment between the customer and the merchant. There is no merchant PayPlus terminal. A code activates the merchant discount. The merchant charges the customer on the merchant’s own till, outside Perkly. Perkly charges the ₪15 membership inside the app on Perkly’s own PayPlus account and terminal. Code format, expiry, single-use, merchant confirmation, and how savings are verified are not decided (O-15).

## 1. What Perkly is

Perkly connects customers with participating local businesses that offer products, services, and surplus stock. Customers discover offers and receive a code that activates the discount. The merchant charges the customer on the merchant’s own till. Businesses manage their Perkly catalogue, allocated stock, offers, and pickup. Perkly does not take the product payment.

A member can receive an extra merchant-funded saving at participating businesses and can see whether those extra savings cover the membership fee. Public offers stay available to everyone, including people who never join.

The first release is a controlled pilot near Kfar Manda. Geographic expansion waits until fulfilment is reliable and customers come back. No kilometre boundary is defined yet.

## 2. Promises to customers

- A customer can browse and use a discount without a membership.
- Public offers and the member benefit are calculated on the server and shown before a code is issued. The code mechanics themselves are not decided.
- The screen shows the merchant, the branch, the discount, and the pickup or redemption conditions that Perkly controls.
- Perkly does not confirm a merchant-till payment. Closing a tab is not a merchant payment result, because Perkly does not run that payment.
- A product refund is between the customer and the merchant. Perkly does not refund a merchant product sale.
- A member can see public savings, extra member savings, and membership fees as separate figures, then see whether the extra savings covered the fee.
- Perkly does not promise that a shop will never sell the same thing for less outside the app.
- A high rank means verified purchases and trust signals. It does not mean every top result is the best product.
- Search may describe only approved, fresh branch facts. It must not invent a business, a price, availability, or a child-safety claim.

## 3. Promises to businesses

- Launch does not charge a platform sales commission, a buyer fee, a seller cut, or a discount-sharing fee.
- The business funds the extra 3% member saving at participating businesses.
- The merchant’s own till takes the product payment and any acquiring fee on that sale. Perkly bears the cost of collecting membership fees, under the PayPlus agreement once that agreement exists.
- Perkly does not run catalogue checkout or a cashier bill as a payment. A till payment does not, by itself, change Perkly stock. How a discount code relates to stock is not decided.
- App approval is not payment-provider KYC. A business cannot publish offers until Perkly has approved it. There is no merchant PayPlus onboarding.
- Merchant sale funds never settle through Perkly.

## 4. Who can do what

| Person | What they can rely on |
| --- | --- |
| Free customer | Browse, use public offers, buy, collect, ask for support or a refund, and review an eligible completed purchase. |
| Member | Everything a free customer can do, plus the extra 3% at participating businesses while a verified paid period entitles them, and a savings view. |
| Cashier | Fulfilment for an assigned business and branch. A cashier bill that Perkly would charge is deferred. |
| Manager | Catalogue, stock, and offers inside an assigned scope. Reports only where that report scope was granted. Review of a Perkly merchant-sale refund is deferred. |
| Business owner | The owned business, including a restricted path for staff invites, ownership change, and provider details. |
| Administrator | Merchant and offer approval, job retry, and audited operational work. Admin rights are not self-served. |

One person may hold more than one role. A role at one business never grants access to another business. The server checks ownership on every read, change, export, and background job. Details are in `ARCHITECTURE.md`.

## 5. Settled commercial rules

| Rule | What is fixed |
| --- | --- |
| Free customers | Membership is optional. Public offers do not require it. |
| Membership price | ₪15, stored as 1500 agorot, charged inside the app on Perkly’s own PayPlus terminal. The price shown to the customer stays ₪15. |
| Membership interval | One calendar-month billing interval on the provider billing anchor that the provider confirms. It is not automatically 30 days, and it is not automatically the first day of the month. |
| Member saving | An extra 3% of the eligible amount after public offers, once, at participating businesses. The business funds it. |
| Public percentage offers | A published percentage offer is at least 3%. A product may have no public offer. |
| Offer stacking | The best eligible approved public offer on each line, then the member benefit once. Several public offers do not stack. |
| Platform commission | None at launch. |
| Currency | Israeli shekel only. |
| Money storage | Integer agorot. Percentage rates are integer basis points. 3% is 300 basis points. |
| Savings display | Public savings, member savings, and membership fees stay separate. |
| Basket | One business and one branch per discount. Perkly does not take a product payment for that basket. |
| Member coverage | Participating businesses are explicit. No hidden product exclusion and no checkout surcharge that contradicts the advertised 3%. |
| Languages | English, Hebrew, and Arabic. Hebrew and Arabic use RTL. |
| Fulfilment | Pickup first. A service purchase is an entitlement with clear redemption terms, not a reserved appointment. |
| Pilot | Near Kfar Manda, then expand only after reliable fulfilment and repeat use. |

The public-offer ceiling and the PostgreSQL major are not settled (O-01, O-03). PayPlus is the membership provider only (D-22). Merchant settlement through PayPlus is not an open question. Discount-code mechanics are O-15.

## 6. How a price is calculated

The server calculates the discount. The browser cannot set it. The result is the amount the merchant may charge on the merchant’s till. Perkly does not collect it. A code activates the discount. How that code is formatted, how long it lasts, whether it is single-use, how the merchant confirms it, and how savings are verified are not decided.

1. Check the product, branch, merchant, active approved offer, quantity, and membership on the server.
2. Extended reference amount for a line is the integer reference price in agorot multiplied by the quantity.
3. Apply the one eligible public percentage to that extended amount. Round half up to one agora.
4. Add the post-public line amounts.
5. If the buyer is an eligible paid member at a participating business, take 3% of that post-public total and round half up once.
6. Spread that member saving back across lines by largest remainder. If two lines tie, the earlier line on the saved quote wins.
7. Store the original, public, member, and paid amounts on the line and on the order. Those snapshots do not change when the catalogue changes later.
8. The stored amounts are the discount record. Perkly does not refund the merchant sale. The roadmap's partial-refund example remains the arithmetic if a later decision allocates a returned discount: a 100-agorot line of quantity 3 splits as 33, then 33, then 34. That example is not permission to refund a merchant product payment through Perkly.

Half up for a non-negative amount uses exact integer arithmetic:

```text
discountAgorot = (amountAgorot * rateBasisPoints + 5000) / 10000
```

The division is integer division. Intermediate values use big-integer arithmetic so a product cannot overflow a small integer type.

The member-saving split:

1. Give each line a raw share of `linePostPublicAgorot * memberSavingAgorot / postPublicTotalAgorot`.
2. Assign each line the integer floor of that share.
3. Give the leftover agorot, one each, to the lines with the largest fractional remainders.
4. Break a remainder tie by the lower snapshot line index.
5. The line member savings must add up to the order member saving. The line paid amounts must add up to the order paid amount.

Cumulative refund for a line: after `n` units of original quantity `Q` and paid amount `P` agorot,

```text
cumulativeRefund(n) = (P * n) / Q
```

using integer division. A new refund of `q` units after `k` units were already refunded is `cumulativeRefund(k + q) - cumulativeRefund(k)`. A full return equals `P`. The running total never exceeds `P`.

Zero and negative discounts are rejected. Perkly must not send a product payment at all, including a zero payment. The only PayPlus charge in scope is the ₪15 membership.

Commercial ceilings for a single price, quantity, or order total are not chosen. Finite technical bounds are required before quotes accept input, so overflow is testable. Those bounds are an implementation limit to record when the pricing library is built. They are not a commercial cap decided here.

## 7. Worked examples

Amounts below are shekels. Storage is agorot (₪1.00 = 100 agorot).

| Reference price | Public offer | Free price | Extra member saving | Member price |
| ---: | ---: | ---: | ---: | ---: |
| ₪100.00 | None | ₪100.00 | ₪3.00 | ₪97.00 |
| ₪100.00 | 3% | ₪97.00 | ₪2.91 | ₪94.09 |
| ₪100.00 | 10% | ₪90.00 | ₪2.70 | ₪87.30 |
| ₪100.00 | 20% | ₪80.00 | ₪2.40 | ₪77.60 |

The extra 3% is sequential. A 10% public offer plus membership is a 12.7% reduction from the reference price, not 13%.

In agorot, the 10% row is: reference 10000, public saving 1000, post-public 9000, member saving 270, paid 8730.

₪500 of eligible spend after public offers and before the member discount produces ₪15 of extra saving before rounding. That is an illustration of the rate. It is not a promise about how much a person will spend.

## 8. Membership value

Use one reporting window for all three figures:

- Public savings: the public-offer reduction only.
- Member savings: the extra 3% only, after returns of those purchases.
- Membership fees: confirmed charges, with confirmed fee refunds visible separately.

Net member value equals confirmed extra savings, adjusted for returned purchases, minus actual membership fees, plus confirmed fee refunds.

A public offer never counts as the membership benefit. Pending checkout does not grant paid access. Access exists only for a verified paid period, and a separately verified revocation can remove it. Refunding a fee and revoking access are different facts.

Gross membership billings equal confirmed member charges times ₪15, with refunds shown separately. Merchant sales volume is not Perkly revenue.

## 9. Offers and stock

- A published percentage offer is at least 3% and has a start, an end, a pickup interval, reference-price evidence, and an approval state.
- Unapproved, expired, or invalid promotions cannot be shown as an active discount.
- A material edit returns an offer to review.
- A CSV import sets available-to-sell Perkly stock. It is not a count of the physical shelf.
- Perkly does not consume stock because a PayPlus sale was captured. There is no such sale. Whether a discount code reserves stock is O-15, not a rule to invent.
- A cashier bill that Perkly charges is deferred. Do not build one.

## 10. Membership payment

These rules apply only to the ₪15 membership charge on Perkly’s own PayPlus terminal. They do not apply to a merchant product sale.

- Hosted payment page only. Perkly never sees PAN or CVV.
- A browser return or a success query parameter does not grant a paid period.
- Unknown results stay unknown until a server lookup of the same membership reference resolves them. Unknown is not a reason to start a second membership charge.
- A membership fee refund and access revocation are different facts. Whether PayPlus can refund that fee without PAN or CVV is still an E01 question.
- Merchant product refunds, merchant settlement, and merchant checkout through Perkly are deferred. Do not build them.

## 11. Pickup and services

The first release still aims at collection at the branch. Perkly does not treat a captured product payment as the start of pickup, because Perkly does not capture that payment. How a discount code relates to ready or pickup is not decided.

A service is an entitlement with the redemption terms shown with the discount. Perkly does not book an appointment slot in this release.

## 12. Languages and the installable app

Customer, merchant, support, and essential admin flows ship in English (`en`), Hebrew (`he`), and Arabic (`ar`). Hebrew and Arabic are right-to-left, including amounts, consent, receipts, and notifications that Perkly renders.

The first client is a responsive installable web app. Native app-store packages are a later milestone, not part of this launch.

An offline or reopened page must not show a usable membership-paid confirmation. The server remains the record of the membership charge. It is not the record of the merchant’s till.

## 13. Workflows in the first release

**Customer.** Discover and search. Open a business, branch, offer, or product. See the server discount. Receive a code whose mechanics are not yet decided. Pay the merchant outside Perkly. Join, view, or cancel the ₪15 membership inside the app. See savings. Save favourites. Read notifications. Write a verified review. Contact support. Export or delete the account. Read legal and accessibility information. Do not pay the merchant through a Perkly hosted page.

**Merchant.** See application status. Use the dashboard. Edit branch profile and facts. Invite staff and assign roles. Manage products, services, surplus, and images. Set allocated inventory and import CSV through a preview. Create an offer and see review status. Charge the customer on the merchant’s own till. Handle support. Do not open a PayPlus terminal, a cashier-bill charge, or a Perkly settlement report for product sales.

**Administrator.** Review merchants and offers. Suspend and handle complaints. Handle membership payment exceptions once that integration exists. Retry jobs. Handle support, moderation, and privacy operations. Read audit history and operating health. No screen marks a merchant sale paid, grants an entitlement that was not verified, or deletes financial history. A correction is a verified event or an authorized adjustment with a traceable reason.

## 14. What the first release includes

Accounts and roles. Business onboarding. Branches and staff. Product, service, and surplus listings. Allocated inventory and CSV import. Approved offers. Discovery and intent search. A discount activated by a code, once the open code mechanics are decided. Membership hosted on Perkly’s own PayPlus terminal, once E01 is answered. Verified reviews. Support. Notifications. Privacy operations. Membership reconciliation, not merchant-sale settlement. Admin. The installable web app. AWS deployment and operating tools, when the later phases and owner setup exist.

## 15. What the first release excludes

These are not part of the first revenue model and are not prerequisites:

- Advertising and sponsored placement
- Prize draws
- Cashback wallets
- Financing or lending
- Platform custody of merchant money
- Delivery logistics
- Baskets that mix businesses
- Appointment scheduling
- Universal point-of-sale synchronization
- Native app-store releases
- Perkly checkout, cashier-bill payment, settlement, or refund of a merchant product sale
- A merchant PayPlus terminal

Each of those needs its own product decision later.

## 16. What this document does not claim

No screen, route, database, or test exists because of this file. Nothing is production-ready. PayPlus has not approved the membership charge. Figures in the break-even illustration in the roadmap are not quotes and are not repeated here as forecasts.
