# EVTY — Repository-Wide Build Instructions

These instructions govern all implementation work in this repository. The product name is **EVTY** (the repository slug may remain `enty`). Requirements in this file and `docs/` are binding unless a recorded product decision supersedes them.

## Mission and delivery standard

Build EVTY as a real event discovery, ticketing, advertising and services marketplace—not a business proposal, static prototype, or collection of disconnected screens. Deliver responsive web experiences and Android/iOS clients backed by one authoritative API and database. The Android release artifact must connect to the production backend. Do not represent mock, local-only, or sandbox-only behavior as production-ready.

The user requires a complete development package spanning:
1. Project overview and product requirements
2. UI/UX design and screen/user journey specifications
3. Android/iOS application requirements and release
4. Public website, organizer, vendor, promoter and admin web portals
5. Backend architecture, APIs, auth and business logic
6. Database schema, ERD, relationships, migrations and seeds
7. Payments, finance, negotiated commissions, refunds and settlements
8. QR ticketing, gate security, duplicate prevention and offline operation
9. Promoters, advertising, vendors, bookings and marketplace revenue
10. Email, SMS, push and in-app notifications
11. Admin operations, verification, moderation, support and reporting
12. Security, privacy, audit and compliance/legal-review considerations
13. Functional, integration, payment, security, performance and acceptance testing
14. Deployment, APK/AAB, iOS release, monitoring, maintenance and rollback
15. Business plan, financial assumptions, revenue strategy and investor materials
16. Master developer instructions, handover and acceptance checklist

Use the complete requirements in:
- `docs/EVTY_COMPLETE_BUILD_PACKAGE.md`
- `docs/EVTY_PRODUCT_REQUIREMENTS.md`
- `docs/ARCHITECTURE_AND_FINANCIAL_SAFETY.md`

## Product roles and journeys

Support attendees, organizers/owners, organizer staff, promoters, advertisers, vendors, gate staff, support, moderators, finance operations and platform administrators. Apply least privilege and enforce all permissions server-side, including object/event/organization scope.

Implement and test complete journeys: registration/login; event creation/moderation/publishing; ticket inventory and checkout; verified payment and ticket issuance; QR gate scan/admission; organizer sales and attendance reports; negotiated commission agreements; refunds and settlements; promoter attribution and payable commissions; ad campaign submission/review/delivery; vendor listings and booking enquiries; notifications; and admin queues, audit and reporting.

## Technical and security principles

- Start with a modular monolith and explicit domain boundaries; do not add microservices without a demonstrated need.
- Web and mobile clients use shared, versioned API contracts and the same authoritative backend/database.
- Inspect repository constraints before choosing frameworks. Record material architecture choices as ADRs; do not silently assume a stack.
- Validate inputs, cap payload sizes, paginate, return safe consistent errors, rate-limit sensitive operations, and enforce object-level authorization.
- Use idempotency keys for retryable financial and fulfillment operations.
- Use transactional outbox patterns where feasible; async notification/webhook failures must not undo event or money state.
- Use structured logs, health/readiness checks, metrics, alerts, backups, restore tests, and documented rollback.
- Never log passwords, bearer tokens, API keys, webhook secrets, payment credentials, full government IDs, or unnecessary sensitive personal data.
- Do not claim legal/regulatory compliance without qualified review; flag areas requiring legal review.

## Money, payment and ticket invariants — must never be weakened

- A browser/app redirect is not proof of payment. Verify payment server-side using provider signatures/status.
- Match provider reference, amount, currency, merchant/account and order before fulfillment.
- Callbacks and commands are idempotent; retries cannot duplicate tickets, ledger entries, refunds or payouts.
- Reserve/consume ticket capacity atomically to prevent overselling under concurrency.
- Represent money as integer minor units and explicit currency; never use binary floating point for financial arithmetic.
- Keep an append-only balanced ledger. Correct via reversal/adjustment entries, not destructive edits.
- Store negotiated organizer commission agreements as versioned snapshots; the applicable accepted terms govern the order.
- Define and test fee allocation, rounding, refund treatment, promoter commission reversals and settlement eligibility.
- Pay only cleared, unreversed payable funds; retain payout references, states, audit trail and reconciliation.
- Tickets use unique opaque IDs and QR payloads. Admission is event-scoped and atomic; define offline scan and sync-conflict behavior.
- Never store payment card PAN or CVV; use provider-hosted/tokenized payment methods.

## Quality gates and definition of done

Do not mark a requirement complete merely because a screen exists. Every feature must have acceptance criteria mapped to code and tests, authorization/isolation coverage, validation and failure states, reproducible migrations, automated unit/integration/contract tests, and relevant end-to-end evidence.

Critical test cases include provider verification, duplicate/out-of-order callbacks, idempotent checkout, concurrent oversell, ticket issuance, duplicate scans, refund/commission reversal, payout caps, ledger balance, and reconciliation. Also perform security, accessibility, performance, device, production configuration, monitoring, backup/restore, and rollback checks.

Deliver release notes, known issues, runbooks, source/build instructions, environment variable documentation (without secrets), migration/seed instructions, and handover. Report honestly what is implemented, what is tested, and what remains blocked.

## Implementation sequencing

Build a coherent tested vertical slice first:
1. Repository audit, architecture decisions, CI, environment configuration, identity, permissions and schema.
2. Event publishing, ticket inventory, order, payment-provider sandbox, ticket issuance.
3. Attendee and organizer portals; gate staff QR validation.
4. Ledger, negotiated commissions, refunds, settlements and reconciliation.
5. Promoter, advertising, vendor marketplace and notification channels.
6. Admin operations, security/privacy review, accessibility, performance and production release.

Do not invent unresolved product decisions. Record owner, date, rationale and impact for provider choice, payout setup, commission/fee/tax rules, offline admission, promoter attribution, ad billing, vendor booking behavior, notification providers, launch geographies, retention, and service-level targets.
