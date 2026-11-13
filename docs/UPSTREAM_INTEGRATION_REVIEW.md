# Upstream review: demtaiwo1-eng

Reviewed: 2026-11-13  
Source repositories:
- https://github.com/demtaiwo1-eng/Winning-game-
- https://github.com/demtaiwo1-eng/Winning-game1

EVTY destination: https://github.com/taiwotoluodeyemi-oss/enty

## Latest upstream activity

The primary upstream repository, `Winning-game-`, has active changes on 13 November 2026. Its application workspace is nested at `eventsss123/eventsss-main` and identifies itself as EPHINTA/ESS, with an Express/Prisma API, Vite/React web client, and Capacitor mobile workspace. It is not the same codebase or product identity as EVTY.

Relevant recent commits:

| Commit | Change | EVTY assessment |
|---|---|---|
| [0fd60f1](https://github.com/demtaiwo1-eng/Winning-game-/commit/0fd60f19df75061de5a874fc0daaefab85616c32) | Database-backed DEMO/TEST/LIVE payment-mode control, audit history, transaction lock, and production credential gates | Adopt the fail-closed mode-control pattern when EVTY payment adapters are implemented. Do not copy its OPay settings or fixed fee policy. |
| [391911c](https://github.com/demtaiwo1-eng/Winning-game-/commit/391911c3ef71a8260bced0f0acb6919ce39c193a) | Role-aware EPHINTA help assistant and isolated portal-scale QA seeding | Reuse the role-aware help concept and isolated test-persona approach after EVTY portals exist. |
| [cbc139e](https://github.com/demtaiwo1-eng/Winning-game-/commit/cbc139e5d4d0e790556725b931ccc24d062721e5) | OPay as the NGN collection and payout provider, with provider metadata and 2% fee defaults | Treat as a provider integration reference only. Verify EVTY's merchant eligibility and commercial/legal terms independently. |
| [115379c](https://github.com/demtaiwo1-eng/Winning-game-/commit/115379cddd0e7e11cbe0f794ab9ce854ccbe6e32) | Sanitized OPay connectivity diagnostics and terminal cancellation handling | Adopt secret-safe diagnostics and explicit terminal-state handling in EVTY provider adapters. |
| [8419dbf](https://github.com/demtaiwo1-eng/Winning-game-/commit/8419dbf87fffe0fb9988cd84da1b9fefc52ffb55) | Merchant transfer readiness probes and duplicate/closed transfer handling | Reuse readiness checks and provider-state reconciliation patterns. |
| [21c54f9](https://github.com/demtaiwo1-eng/Winning-game-/commit/21c54f97070743c4a37bb88d6c49cd4bc6d6b732) | OPay bank payout adapter, idempotency, reconciliation, and payout polling | Reuse the reliability patterns only after EVTY's ledger and payout model are established. |
| [58bfb53](https://github.com/demtaiwo1-eng/Winning-game-/commit/58bfb53f637e1c5b83c8ed90e32158298d1b0f7a) | Verified Nigerian bank withdrawals, webhook settlement and vendor withdrawal UI | Review as a reference for future EVTY organiser settlements; do not import its wallet assumptions. |

The secondary repository, `Winning-game1`, has one visible commit dated 24 October 2026 ("Create And") and no substantive newer application history surfaced in this review.

## Integration decisions

### Patterns to carry into EVTY

1. Payment mode must have one shared database-backed source of truth, with explicit DEMO/TEST/LIVE separation.
2. Payment and payout operations must fail closed if the mode cannot be verified.
3. Mode changes must be serialized against in-flight transactions and audited.
4. LIVE mode must require dedicated production credentials, an explicitly identified production deployment, and verified provider readiness.
5. Provider callbacks and polling must be idempotent; ambiguous outcomes must be reconciled rather than blindly retried or refunded.
6. Logs must expose useful error categories without secrets, credentials, or payment-sensitive payloads.
7. Portal QA must use isolated test data and cover role boundaries and cross-account access.
8. Help content should be role-aware and link to the correct EVTY workflow.

### Do not copy into EVTY

- EPHINTA/ESS branding, application identifiers, route structure, or task-planner domain models.
- OPay credentials, endpoint configuration, payout activation flags, or provider-specific assumptions.
- A universal 2% organiser commission. EVTY requirements specify individually negotiated, versioned organiser agreements.
- EPHINTA's wallet, escrow, booking, vendor, or subscription business rules without mapping them to EVTY's own financial model.
- Any upstream deployment status as proof that EVTY has been tested or deployed.

## EVTY baseline observed during this review

- The repository has a root Express/Prisma API and a separate Next.js discovery frontend.
- The Prisma datasource is currently SQLite; the product architecture document describes PostgreSQL as the intended production relational database.
- The public web homepage and event-detail pages now read published listings and current ticket availability from the API; no hard-coded sample inventory is presented as real listings.
- The API supports registration/login, event creation, paginated public event discovery, public event details with ticket availability, organiser event listing, draft event editing, draft ticket-type creation, audited submission for review, and audited administrator approval/return-to-draft moderation.
- Checkout, verified payment webhooks, immutable double-entry ledger posting, ticket issuance, QR redemption, refunds, settlements, promoter attribution, advertising campaign execution, vendor workflows, and admin moderation remain separate implementation and acceptance-test work.
- The upstream repository was available with read access; the EVTY repository is available with administrative write access. No upstream files were copied wholesale.

## Release principle

A feature is not production-ready because code or documentation exists. Each EVTY capability must have automated tests, negative authorization tests, migration evidence, provider sandbox evidence where applicable, and a documented operational recovery path. Real-money payments and public launch must remain disabled until those gates pass.
