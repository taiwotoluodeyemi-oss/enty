# EVTY
## Independent Event Commerce, Ticketing & Advertising Marketplace

**EVTY** is an independent, Nigeria-first event-commerce platform designed for international expansion. It brings attendees, organisers, promoters, advertisers, vendors, and gate teams together through event discovery, ticketing, digital admission, promotion, and commercial reporting.

> Brand correction: use **EVTY** across user-facing copy, documentation, application metadata, and new code. The GitHub repository URL remains `taiwotoluodeyemi-oss/enty` unless its owner separately renames the repository.

## Product direction

- Independent company and product identity.
- Web-first launch; native Android/iOS apps can follow.
- Modular monolith for the initial release.
- Organiser commission rates are individually negotiated and contract-bound—not a universal fixed rate.
- Nigeria is the launch market; country, currency, timezone, payment provider, tax treatment, and settlement rules must be configurable.
- Ticketing, verified payment, financial ledger, and gate admission are the first commercial priorities.

## Product modules

1. Identity and role-based access
2. Organiser onboarding and verification
3. Event publishing and moderation
4. Ticket categories, inventory, orders, and checkout
5. Payment-provider integrations
6. Commission agreements and double-entry financial ledger
7. Digital ticket issuance and QR validation
8. Gate operations and carefully controlled offline scanning
9. Advertising and sponsored placements
10. Promoter referral/affiliate attribution
11. Vendor directory and lead generation
12. Notifications, reviews, analytics, and reporting
13. Administration, audit, trust, safety, and operations

## Critical financial and admission rules

- Never issue a ticket from a browser redirect alone. Verify payment server-side with a trusted provider event/API.
- Payment webhooks must be signature-verified and idempotent.
- Store a durable ledger; provider split settlement is an execution mechanism, not the platform's sole financial record.
- Lock the applicable commission agreement/version for event sales. Do not silently change rates on already-purchased tickets.
- Keep organiser commission and promoter reward accounting separate to prevent double deductions.
- QR images are identifiers, not admission proof. Validate current ticket state server-side and redeem atomically.
- Refunds, cancellations, chargebacks, settlement and reconciliation must create auditable financial records.
- Do not treat pending payments, organiser proceeds, taxes, or refunds as platform revenue.
- Sensitive actions require least-privilege authorization and audit trails.

## Initial delivery sequence

### Stage 1 — Core ticketing MVP
Identity and roles; organiser onboarding; event creation and approval; ticket inventory; orders/checkout; negotiated commission agreements; payment verification; digital ticket delivery; connected gate scanning; core admin operations.

### Stage 2 — Commercial expansion
Advertising campaign management and sponsored listings; promoter referrals; vendor directory; financial reporting; customer notifications.

### Stage 3 — Controlled launch and scale
Security, payment, concurrency, QR, refund, recovery and load testing; pilot organisers; production runbooks; multi-country/payment expansion; mobile applications.

## Technical direction

The preferred architecture includes a Next.js/React web client, Node.js API, PostgreSQL, Redis, object storage, provider abstraction, and OpenAPI. The repository currently keeps the Express/Prisma API at its root and now includes a separate `web/` Next.js discovery UI workspace. The frontend now loads published event listings and ticket availability from the EVTY API and provides live event-detail pages. Checkout, payment, inventory reservation, ticket issuance, and full organizer workflows remain under implementation.

## Product specification

See [EVTY Product Requirements](docs/EVTY_PRODUCT_REQUIREMENTS.md) and [Architecture & Financial Safety](docs/ARCHITECTURE_AND_FINANCIAL_SAFETY.md).

## Status

The blueprint has been integrated into the repository documentation. Application implementation, payment integrations, security controls, and production readiness must be built and verified separately; this README does not claim those features are already implemented.

## Upstream engineering review

The latest transferable engineering updates from `demtaiwo1-eng/Winning-game-` have been reviewed. See [Upstream Integration Review](docs/UPSTREAM_INTEGRATION_REVIEW.md) for the commit-by-commit assessment, integration decisions, and EVTY-specific release gates. EPHINTA is a separate product; its branding and incompatible business rules are not copied into EVTY.
