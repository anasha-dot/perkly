# Release gates

**Status:** Template for a future build. No gate is complete.
**Date:** 20 October 2026.
**Release state:** None. The project is not local, not staging, not a qualified live test, not a pilot, and not public.
**Rule:** A gate is complete only when the evidence path contains a record of a command, environment, and result for this new build. The roadmap is not evidence. Phase 00 documents are not evidence. A simulator is not a provider test.

Reserved evidence locations, all empty of results:

- `docs/evidence/` — sanitized command output and device notes, created when a real check is saved
- `docs/releases/` — versioned manifests, created when a real artifact exists
- `docs/runbooks/` — operating steps, created when the procedures are written from a running system

None of those directories have been created, because there is nothing honest to put in them yet.

| # | Gate | Evidence slot | State |
| --- | --- | --- | --- |
| G01 | The new repository runs locally from its README without AWS and without an older Perkly source tree. | `docs/evidence/G01-local-readme.md` | Not complete. No repository and no README. |
| G02 | Native database, container, unit, integration, contract, and key browser checks pass for the release. | `docs/evidence/G02-automated-checks.md` | Not complete. No tests have been run. |
| G03 | Pricing, reservation, replay, refund, and membership checks pass under the required concurrency and failure conditions. | `docs/evidence/G03-money-matrix.md` | Not complete. Covers AT01–AT20 when those tests exist. |
| G04 | The provider approves the funds-flow model and each live merchant account and the Perkly account. | `docs/evidence/G04-provider-approval.md` | Not complete. E01 and E02 are pending. `PAYMENT_CONTRACT.md` is a checklist, not approval. |
| G05 | Sandbox and live isolation, and the pause-new-sales controls, have negative tests and recovery tests. | `docs/evidence/G05-environment-isolation.md` | Not complete. |
| G06 | Real purchase, refund, membership, cancellation, receipt, and settlement flows are verified, including events that originate at the provider. | `docs/evidence/G06-live-money.md` | Not complete. AT34 is reserved for the controlled live test. |
| G07 | Customer, merchant, and admin launch flows are usable in English, Hebrew, and Arabic. RTL, camera denial, offline recovery, and accessibility have evidence. | `docs/evidence/G07-language-devices.md` | Not complete. E06 is pending. |
| G08 | Cognito sign-up, recovery, refresh, logout, disabled users, server permissions, and admin MFA work in the hosted environment. | `docs/evidence/G08-cognito.md` | Not complete. Local identity code, when it exists, does not satisfy this gate. |
| G09 | Bedrock matching has a real evaluation, fact provenance, and a safe fallback. A filters-only pilot needs an explicit owner decision and still does not complete this gate. | `docs/evidence/G09-bedrock.md` | Not complete. No model is selected. |
| G10 | Support, export, approved erasure and retention, notification suppression, and recurring cancellation can be operated. | `docs/evidence/G10-privacy-ops.md` | Not complete. E05 retention rules are not approved. |
| G11 | Security review has no unresolved critical issue. Material findings have a written release decision and controls. | `docs/evidence/G11-security-review.md` | Not complete. No reviewer has been named (E08). |
| G12 | HTTPS, private networking, runtime grants, secrets, backup and restore, rotation, alerts, and rollback have been exercised. | `docs/evidence/G12-operations.md` | Not complete. No AWS resources exist. |
| G13 | Legal, accounting, merchant, and translation inputs, and the final policy versions, are approved for the actual release. | `docs/evidence/G13-policies.md` | Not complete. E05 and E06 are pending. |
| G14 | Current costs, operating ownership, and support coverage are documented. | `docs/evidence/G14-ownership.md` | Not complete. |
| G15 | No unexplained financial discrepancy remains. The pilot shows usable customer and merchant value and at least one observed renewal cycle. | `docs/evidence/G15-pilot.md` | Not complete. |
| G16 | The owner approves the specific image digest, configuration, rollout scope, and recovery plan. | `docs/releases/` manifest cited by the approval note | Not complete. There is no digest. |

Production-ready is not a label this project can use. No framework, generator, or document checklist substitutes for the evidence slots above.
