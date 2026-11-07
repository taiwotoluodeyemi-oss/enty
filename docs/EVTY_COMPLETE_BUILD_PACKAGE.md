# EVTY Complete Application Build Package

**Status:** Developer-ready baseline specification; implementation and release evidence are tracked separately.  
**Product name:** EVTY  
**Repository:** `taiwotoluodeyemi-oss/enty`

This document is the package index and delivery contract for the EVTY application. It is not a claim that the application is already implemented.

## Product outcome

Build a production-capable, Nigeria-first event discovery and ticketing marketplace with internationalization in its architecture. Attendees, organizers, promoters, advertisers, vendors, gate staff, support staff, and platform administrators use one shared backend and authoritative database through responsive web experiences and Android/iOS applications.

A release is accepted only when critical journeys operate against the deployed backend and pass automated and end-to-end tests. Static mockups, fake success states, local-only data, and demonstration payment flows do not count as completed functionality.

## Package structure and required artifacts

The delivery archive should contain these 16 numbered folders. Each artifact must include purpose, assumptions, requirements, diagrams or examples where appropriate, acceptance criteria, and traceability to implementation/tests.

| Folder | Required contents |
|---|---|
| `01_Project_Overview` | Product vision, goals/non-goals, personas, scope, requirements, roadmap, assumptions, glossary |
| `02_UI_UX_Design` | Design system, responsive behavior, screen inventory, navigation, accessibility, loading/empty/error states, journey maps |
| `03_Mobile_Application` | Android/iOS architecture, app configuration, secure token storage, deep links, permissions, offline behavior, APK/AAB and iOS release instructions |
| `04_Web_Application` | Public marketplace, attendee account, organizer, promoter, vendor, gate and admin portal requirements |
| `05_Backend_API` | Service architecture, API conventions, endpoint catalog, auth, authorization, validation, idempotency, error contracts |
| `06_Database` | ERD, schema, indexes, constraints, migrations, seed strategy, data dictionary |
| `07_Payments_Finance` | Provider integrations, payment lifecycle, negotiated commissions, ledger, refunds, settlement policies, reconciliation |
| `08_Ticketing_Gate_Security` | Ticket lifecycle, QR design, scan authorization, duplicate prevention, offline scan policy and sync conflict rules |
| `09_Marketplace_Advertising` | Promoter attribution, campaign booking, ad review/delivery, vendor profiles, enquiry/booking flows and revenue rules |
| `10_Notifications` | Email, SMS, push and in-app event catalog, templates, preferences, delivery retries and provider adapters |
| `11_Admin_Operations` | Verification, moderation, queues, support, audit, reporting, operational actions and runbooks |
| `12_Security_Compliance` | Threat model, privacy/data map, access matrix, secrets, retention, fraud controls, legal-review items |
| `13_Testing_QA` | Test strategy, fixtures, functional, integration, contract, security, accessibility, performance and acceptance suites |
| `14_Deployment` | Environments, CI/CD, migrations, secrets, backups/restore, Android APK/AAB, iOS release, monitoring and rollback |
| `15_Investor_Business_Plan` | Business model, revenue assumptions, operating costs, financial scenarios, go-to-market and investor presentation materials |
| `16_Developer_Instructions` | Master implementation prompt, repository conventions, definition of done, handover checklist and acceptance sign-off |

## Roles and access

- **Attendee:** discover events, manage profile, purchase and access tickets, request eligible refunds, receive notifications.
- **Organizer/owner:** create and manage events, ticket classes, staff access, agreed platform commission, settlement settings, sales and attendance reports.
- **Organizer staff:** limited event-scoped capabilities explicitly granted by the owner.
- **Promoter:** use tracked referral links/codes and view attributable performance and payable commissions.
- **Advertiser:** create campaigns, submit creative for review, manage approved placements and view delivery/reporting.
- **Vendor:** maintain service listing, receive and respond to booking/enquiry requests.
- **Gate staff:** validate tickets for assigned event(s), record admission, and access only the minimum event data needed.
- **Support/moderator/admin/finance operations:** least-privilege permissions, with sensitive actions audited and financial actions separated.

Authorization must be enforced server-side for every request and object. Hiding UI controls is not authorization.

## Core end-to-end journeys

1. Register/sign in, verify contact as configured, and establish role-appropriate access.
2. Organizer creates an event, submits it for moderation if required, configures ticket tiers/capacity and publishes.
3. Attendee discovers event, checks out, completes provider-hosted or tokenized payment, and receives a ticket only after trusted payment confirmation.
4. Ticket is issued with a unique opaque identifier and signed/validated QR representation; gate staff scans and records admission.
5. Organizer views paid sales, fees, commission, refunds, settlement eligibility and attendance with reconciled totals.
6. Promoter attribution is captured at checkout under a documented attribution window and commission rule; retries cannot duplicate earnings.
7. Advertiser submits campaign; admin approves/rejects; eligible placements deliver and are measured according to defined billing policy.
8. Vendor registers/listings; attendee submits booking enquiry; vendor responds; all states and notifications persist.
9. Admin reviews verification/moderation, payment anomalies, disputes, webhook failures, refunds, settlements and audit records.

## Architecture baseline

Use a modular monolith first, with a versioned JSON API and shared relational database. Keep domain boundaries explicit; do not introduce microservices without a demonstrated operational need. Recommended domains:

- Identity & access
- Profiles and organizations
- Events and moderation
- Ticket inventory and orders
- Payments, ledger, commissions and settlements
- Ticket issuance and admission
- Promoter attribution
- Advertising
- Vendor directory and enquiries
- Notifications and webhook/outbox delivery
- Administration, audit and reporting

Web, Android and iOS clients must use the same backend contracts and authorization rules. Select concrete frameworks only after checking repository constraints and documenting the decision in an ADR. Do not silently substitute a mock backend.

## Non-negotiable financial and ticketing invariants

- The client return/redirect is not proof of payment. Verify provider signatures and payment status server-side.
- Verify provider transaction reference, amount, currency, merchant/account and order association before fulfillment.
- Payment callbacks are idempotent; repeated or out-of-order events cannot issue extra tickets or duplicate ledger entries.
- Ticket capacity is reserved/consumed atomically; concurrent purchases cannot oversell.
- All monetary values use integer minor units plus explicit ISO currency; no binary floating-point arithmetic.
- The financial ledger is append-only, balanced per transaction, and the source of truth for balances. Corrections use reversal/adjustment entries, not destructive edits.
- Organizer commission is negotiated and versioned per organizer/event/agreement. The accepted agreement snapshot applies to the relevant order.
- Refund eligibility, fee treatment, promoter commission reversal, and settlement lock points are explicit and tested.
- A settlement cannot exceed cleared, unreversed, payable funds. Every payout has provider reference, state, audit record and reconciliation path.
- Ticket admission is event-scoped and atomic. A ticket cannot be admitted twice online; offline scans require a defined risk-aware policy and conflict handling.
- Do not store card PAN/CVV. Use payment provider-hosted/tokenized flows.

## API and operational requirements

- Version API routes (for example `/api/v1`) and publish OpenAPI.
- Validate all input, bound payload size, paginate collections, use consistent safe errors, rate-limit sensitive routes, and enforce object-level authorization.
- Support idempotency keys for checkout, payment initiation, refund, payout and other retryable mutations.
- Persist domain event/outbox records transactionally where feasible; process notifications/webhooks asynchronously with bounded retries, exponential backoff, dead-letter visibility and replay safety.
- Audit role changes, moderation, commission changes, refunds, payout actions, exports and privileged access.
- Never log passwords, access tokens, API keys, webhook secrets, payment credentials or unnecessary sensitive personal information.
- Provide health/readiness endpoints, structured logs, metrics, alert thresholds, backup verification and documented rollback.

## Quality gates and acceptance evidence

A feature is complete only when:
- Its acceptance criteria map to implementation and tests.
- Authorization and tenant/event isolation are covered.
- Validation, error, empty, loading and retry states are implemented.
- Database migrations are reproducible and rollback/recovery is documented.
- Unit, integration and API contract tests pass in CI.
- Critical attendee/organizer/gate/payment journeys pass end-to-end in a provider sandbox.
- Payment, refund, ticket issuance, duplicate callback, oversell, duplicate scan and settlement reconciliation cases pass.
- Security review covers authentication, access control, injection, XSS/CSRF as applicable, SSRF, secrets, rate limiting, dependency vulnerabilities and privacy.
- Performance tests establish and pass agreed targets under a documented workload.
- Production configuration, monitoring, backups, restore test and rollback procedure are verified.
- Android release artifact is built from the release commit and configured to call the production API; it is not a demo-only app. iOS release is similarly built and signed through the agreed Apple release process.
- Release notes, known issues, operator runbooks and handover materials are delivered.

## Delivery phases

1. **Foundation:** repository audit, architecture decisions, environments, CI, identity, permissions, schema and API conventions.
2. **Core event commerce:** events, ticket inventory, orders, payment-provider sandbox, ticket issuance and attendee account.
3. **Organizer and gate:** organizer portal, sales reporting, QR validation, gate staff access and admission controls.
4. **Finance integrity:** negotiated agreements, ledger, refunds, settlement workflows, reconciliation and finance operations.
5. **Marketplace extensions:** promoters, advertising, vendors, enquiries/bookings and notification channels.
6. **Hardening and release:** admin operations, security/privacy review, accessibility, performance, device testing, production deployment and release acceptance.

Prioritize a coherent, tested vertical slice over implementing many disconnected screens.

## Open decisions that must be recorded, not guessed

- Framework/runtime choices based on current repository and team capacity.
- Payment provider(s), merchant-of-record arrangement, settlement bank/payout capabilities and supported currencies.
- Whether ticket transfer/resale, partial refunds, chargebacks and offline gate admission are in initial release.
- Exact commission calculation order, rounding, tax/fee responsibility and agreement precedence.
- Promoter attribution model/window and refund clawback.
- Advertising inventory, pricing, billing events and advertiser eligibility.
- Vendor booking payment or enquiry-only behavior.
- SMS/push/email providers, costs and delivery guarantees.
- Initial launch geography, data retention periods, age policy, and legal review requirements.
- Numeric service-level, load, latency, availability and recovery targets.

Each decision requires an owner, date, rationale, and impact. Legal/regulatory conclusions require qualified review; the package must not claim compliance without evidence.
