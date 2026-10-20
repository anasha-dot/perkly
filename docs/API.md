# Perkly HTTP API

**Status:** Proposed contract, plus the implemented shell, health, local session, and Cognito protocol routes. No OpenAPI document has been generated. Routes below that are not marked implemented are not implemented.

**D-22:** Do not implement a route that charges, captures, refunds, or settles a merchant product sale. PayPlus, if later called, is only the ₪15 membership on Perkly’s own terminal. Cashier-bill payment and merchant checkout are `deferred_by_owner`. Discount-code mechanics are not specified.
**Prefix:** `/api/v1`
**Date:** 20 October 2026.
**Source:** Roadmap section 8.1. Paths that section wrote out are repeated here. Paths it described only as a family are marked "family proposal" so they are not mistaken for routes that already exist.

This document describes Perkly's own application API. It does not describe a payment-provider API. Provider endpoints are unknown (`PAYMENT_CONTRACT.md`).

## Implemented in P01-01

| Method and path | Contract |
| --- | --- |
| `GET /api/v1` | The process is up. The body includes `{ "name": "perkly", "apiVersion": "v1", "database": "not_connected" }` plus `mode` and the selected adapter names. `database` is not readiness and this is not a session. `payment` is `disabled`. No payment route exists. |
| `GET /api/v1/health` | Liveness. `{ "status": "ok", "service": "perkly-api" }` while the process accepts traffic. No secrets. Shutdown returns 503 `not_ready`. |
| `GET /api/v1/ready` | Readiness. Without `DATABASE_URL`, the database check is `not_configured`. With a local URL, it is `ok` or 503 `not_ready`. The body never includes the URL or a password. |
| Unknown `/api/v1` path | 404 `{ "code": "not_found", "requestId", "fieldErrors": [] }`. The `x-request-id` response header matches the body. |

A future `packages/contracts` module will own the implemented schemas and publish OpenAPI from them. Until those schemas exist, this markdown file is the contract and it remains proposed.

## 1. Rules for every route

- Validate inputs and outputs. Reject unexpected fields on financial writes.
- Money is integer agorot. Currency is `ILS`. Rates are integer basis points.
- The server loads identity, role, business scope, membership, and prices from its own records. The client does not send a trusted role, a trusted paid flag, or a trusted total.
- Mutations from the browser require a session, an exact allowed `Origin`, and CSRF protection.
- Hosted session cookies are `Secure` and `HttpOnly`, with an explicit `SameSite` and path policy set when sessions are implemented.
- Financial creates and financial reviews require `Idempotency-Key`. The key is scoped to the actor and the action. The same key and the same body return the original result. The same key and a different body return a conflict. Retries of one customer action reuse the key.
- A client that does not know whether a financial request succeeded must retry that same key. It must not create a new payment reference.
- Redirect query parameters never change payment, refund, or membership state.
- List endpoints use bounded pagination, filter, and sort. Exact page sizes are an implementation limit to record when the route is built (see O-06). They are not decided here.
- Request bodies, queries, uploads, and exports are bounded. CSV export escapes spreadsheet formula injection.
- Errors use a stable machine code, the request ID, and optional field errors:

```json
{
  "code": "quote_expired",
  "requestId": "req_example",
  "fieldErrors": []
}
```

Proposed status mapping, to be confirmed when handlers exist: `400` validation, `401` no session, `403` authenticated but not allowed, `404` not found or not visible, `409` idempotency or state conflict, `422` domain rule, `503` dependency unavailable. These codes are proposals, not observed responses.

## 2. Session

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `GET /api/v1/session` | Implemented | Returns the current user, role, pool, and CSRF token. No session secret, refresh token, or provider token. Missing or expired cookies return 401 `no_session`. |
| `POST /api/v1/auth/local/session` | Local only | Body `{ "profileId" }` must be one fictional fixture profile. Loopback local mode only. Sets an HttpOnly `perkly_session` cookie. The raw token is not stored and is not in the JSON body. Hosted mode, and any configuration whose identity adapter is not the loopback fixture adapter, returns 404 `local_identity_unavailable`. |
| `GET /api/v1/auth/login` | Implemented | Starts Cognito authorization-code with PKCE. `pool` is `customer` or `admin`; a missing pool means customer. State, nonce, and the PKCE verifier stay on the server. The response redirects to that pool's hosted UI. Without Cognito settings the route is 404 `cognito_not_configured`. Without a database it is 503 `not_ready`. |
| `GET /api/v1/auth/callback` | Implemented | Consumes the stored flow, checks the verifier, issuer, audience, expiry, nonce, and verified email, then sets the HttpOnly session cookie. Reused, expired, or unknown state is 400 `oauth_state_invalid`. A customer-pool token cannot complete an admin login. |
| `POST /api/v1/auth/refresh` | Implemented | Uses the stored refresh token to require a new identity token for the same subject and pool. The JSON body is the session shape. It does not include the refresh token or the identity token. A changed subject returns 401 `identity_mismatch` and revokes the session. |
| `POST /api/v1/auth/logout` | Implemented | Revokes the server session and clears the cookie. When a Cognito refresh token is stored, Perkly asks that pool to revoke it and does not log the token. Provider revoke failure still returns 204. |

`GET /api/v1/session` response shape:

```json
{
  "user": {
    "id": "internal-id",
    "locale": "en",
    "role": "customer",
    "fictional": false,
    "identityProvider": "cognito",
    "fixtureProfileId": null,
    "pool": "customer"
  },
  "capabilities": ["customer"],
  "csrfToken": "opaque"
}
```

The user id is Perkly's immutable id. The response does not include an access token, identity token, or refresh token. `pool` is `customer` or `admin` for Cognito, and null for a loopback fixture session. `admin_pool` in `capabilities` means the session came from the admin pool. It is not an application permission grant. Those guards are P02-03. CSRF is returned and is not enforced yet. An https application origin marks the cookie `Secure`.

The refresh token is stored only until logout because the provider requires the raw token on refresh and revoke. It is not the session cookie and it is not hashed. State and nonce are stored only as SHA-256 hashes. The PKCE verifier is kept until the callback consumes the flow, then cleared. Its hash remains.

## 3. Discovery

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `GET /api/v1/businesses` | Named in the roadmap | Approved public businesses only. Bounded page, filter, and sort. |
| `GET /api/v1/businesses/:id` | Named in the roadmap | Public profile for one approved business. |
| `GET /api/v1/branches/:id` | Named in the roadmap | Public branch facts, honest availability, and price previews. |

Price previews show the free price and, when the viewer is an eligible member and the business participates, the member price. Both come from the pricing rules. Unavailable or empty results are real empty states, not invented businesses.

## 4. Intent search

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `POST /api/v1/search/intent` | Named in the roadmap | Body: query text, UI locale, optional location, optional ages. |

The response is one of: validated filters plus matches, a clarification question, or a recoverable failure. Matches are real branch rows. The model is not allowed to add a business. If AI is disabled or failing, ordinary filters still work. Missing age or location produces a clarification, not a guessed hard match. Distance, when present, is labelled straight-line distance.

Children's names are not a request field.

## 5. Quote

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `POST /api/v1/quotes` | Named in the roadmap | Body is either catalogue branch and product quantities, or a bill-request token. Not both. |

Proposed catalogue body:

```json
{
  "branchId": "internal-id",
  "lines": [{ "productId": "internal-id", "quantity": 1 }]
}
```

Proposed bill body:

```json
{ "billToken": "opaque-one-use-token" }
```

Proposed response:

```json
{
  "orderId": "internal-id",
  "status": "quoted",
  "expiresAt": "2026-10-20T12:10:00Z",
  "currency": "ILS",
  "merchantId": "internal-id",
  "branchId": "internal-id",
  "membershipEligible": false,
  "totals": {
    "referenceAgorot": 10000,
    "publicSavingsAgorot": 1000,
    "memberSavingsAgorot": 0,
    "paidAgorot": 9000
  },
  "lines": []
}
```

The example totals are the free-customer 10% discount from the product spec, in agorot. A member at a participating business would show member savings 270 and a customer-till amount of 8730 for that same reference. The server computes the numbers. The client does not send them. `paidAgorot` here means the discounted amount the merchant may collect outside Perkly. Perkly does not charge it.

One business and one branch. Mixed carts are rejected. Zero and negative discounts are rejected. This route must not create a PayPlus merchant charge. Code issuance is not part of this contract until O-15 is decided.

## 6. Cashier bill

`deferred_by_owner`. Do not implement `POST /api/v1/businesses/:id/bills` or `GET /api/v1/bills/:token` as a Perkly charge. There is no merchant PayPlus terminal and no amount-only bill for Perkly to collect.

## 7. Merchant product payment

`deferred_by_owner`. Do not implement `POST /api/v1/orders/:id/payments` as a launch route. It must not return a PayPlus hosted URL for a product sale. `GET /api/v1/orders/:id` must not treat a browser return as proof that the merchant was paid through Perkly. The merchant’s till is the product payment.

## 8. Fulfilment

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `POST /api/v1/orders/:id/ready` | Named in the roadmap, not the current launch path | Do not require a Perkly capture of the merchant sale. How a discount code relates to ready is O-15. |
| `POST /api/v1/pickups/redeem` | Named in the roadmap, not the current launch path | Do not redeem a pickup because Perkly captured a product payment. |

Wrong merchant, replay, and guess attempts fail and count toward rate limits.

## 9. Merchant product refunds

`deferred_by_owner`. Do not implement `POST /api/v1/orders/:id/refund-requests` or `POST /api/v1/refund-requests/:id/review` as a PayPlus refund of a merchant sale. The merchant handles that refund outside Perkly. A membership fee refund is a different operation and belongs with the membership routes.

## 10. Membership and savings

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `GET /api/v1/membership` | Named in the roadmap | Current consent, displayed price 1500 agorot, paid-through time if verified, renewal and cancellation state. |
| `POST /api/v1/membership` | Named in the roadmap | Explicit consent to the current price and terms. Creates a pending agreement only. |
| `POST /api/v1/membership/cancellation` | Named in the roadmap | Starts cancellation. Does not delete paid periods. |
| `GET /api/v1/savings` | Named in the roadmap | Scoped to the caller. Public savings, member savings, and fees are separate. |

`POST /api/v1/membership` requires `Idempotency-Key`. A pending result grants no member discount. The hosted page, when E01 allows an implementation, is PayPlus on Perkly’s own terminal only. It is not a merchant checkout. A browser return does not grant a paid period.

## 11. Merchant family proposal

The roadmap requires business-scoped branches, staff, catalogue, offers, stock, CSV, and reports. It does not assign URL strings to each of them. Proposed Perkly paths, none implemented:

| Proposed path | Contract |
| --- | --- |
| `POST /api/v1/merchant/applications` | Start an application. |
| `GET /api/v1/merchant/businesses/:businessId` | Owner or staff reads onboarding and provider-onboarding status. |
| `/api/v1/businesses/:businessId/branches` | Branch profile. Scope checked on the server. |
| `/api/v1/businesses/:businessId/staff` | Invitations and roles. Owner-restricted where the matrix says so. |
| `/api/v1/businesses/:businessId/catalogue` | Products, services, surplus, terms, prices. |
| `/api/v1/businesses/:businessId/offers` | Create and read approval state. |
| `/api/v1/businesses/:businessId/stock` | Optimistic version required on edits. Available and reserved stay distinct. |
| `POST /api/v1/businesses/:businessId/stock/csv` | Preview, then a separate confirm. Formula injection rejected on the way in and escaped on the way out. |
| `/api/v1/businesses/:businessId/reports` | Role and report scope required. |

Every handler checks the server-side membership. A manager of business A who passes business B's id receives `403` or `404` without a private body.

## 12. Personal family proposal

The roadmap names the capabilities and not the paths. Proposed Perkly paths:

| Proposed path | Contract |
| --- | --- |
| `GET /api/v1/account` and `PATCH /api/v1/account` | Own profile and locale only. |
| `/api/v1/notifications` | Own notifications. |
| `/api/v1/favourites` | Own favourites. |
| `/api/v1/support/cases` | Own cases. |
| `POST /api/v1/account/export` | Own export, resumable status. |
| `POST /api/v1/account/deletion` | Own deletion request, resumable status. |

Export and deletion are specified as behavior for P09-02. They are not implemented. Financial rows that must be retained need an approved reason (E05). None is on file.

## 13. Admin family proposal

Proposed prefix: `/api/v1/admin/...` for approval, jobs, exceptions, disputes, support, privacy, moderation, and reports.

Requirements that are already fixed:

- The caller is in the admin identity pool, with the required assurance, and has an application admin grant. A customer-pool token is refused.
- Actions are audited.
- The client cannot submit a privileged role and receive it.
- There is no mark-paid endpoint, no unverified grant-entitlement endpoint, and no delete-financial-history endpoint.

Exact admin paths are chosen when those screens are built, under this prefix, and then this document is updated from the implementation.

## 14. Provider webhooks

| Method and path | Proposal status | Contract |
| --- | --- | --- |
| `POST /api/v1/webhooks/payments/:provider` | Named in the roadmap | Membership events only, after E01. `:provider` is PayPlus. No key is registered. Do not accept a merchant-sale event. |

When the membership integration exists, the handler reads the raw body, checks authenticity using PayPlus’s approved method, stores the event once, and acknowledges. Processing is asynchronous. Acknowledgement is not a paid period and is not a merchant settlement.

Until E01, this route must not be implemented.

## 15. Versioning

`/api/v1` is the only proposed prefix. Breaking changes require a new prefix or a documented compatible expansion. Financial idempotency keys remain valid for the life of the operation they created, not for a short browser cache.

## 16. Evidence

`GET /api/v1` was requested on 20 October 2026 against the local process and returned HTTP 200 with `{"name":"perkly","apiVersion":"v1","database":"not_connected"}`. No other route in this file has been requested. The other JSON shapes are illustrations of the proposed contract, not captured traffic.
