# EVTY Implementation Status

This file separates repository implementation from product ambition. Update it as code and tests are delivered.

## Implemented in the repository

- TypeScript/Node API foundation with Express, Prisma, Zod validation, Helmet, bounded JSON parsing, safe generic errors, and graceful shutdown.
- Health endpoints for application liveness and database connectivity.
- Account registration/login with bcrypt password hashing and short-lived JWT access tokens.
- Authentication endpoint rate limiting with standard rate-limit response headers. The current limiter is in-memory and per API process; it is not sufficient as the only control for a multi-instance production deployment.
- Production startup requires a JWT secret of at least 32 characters and an explicit trusted CORS origin list.
- Organiser event creation, draft editing, ticket-category creation, and submission for review.
- Admin event approval/return-to-draft workflow with audit records.
- Public event discovery, filtering, pagination, event detail and ticket availability API.
- Homepage and all-events directory connected to the public API, including responsive event quick-view dialogs and full event detail routes.
- Public event detail responses include organiser display name.
- Integer minor-unit money helper and unit tests.
- Fixed-window rate-limit domain helper and unit tests.
- Paystack server-side transaction initialize/verify adapter and timestamped plus legacy webhook-signature verification helpers, with unit tests. This adapter is not connected to order checkout or ticket fulfillment.
- GitHub Actions workflow for Prisma validation/client generation, API build/tests, and web lint/build on pushes and pull requests to `main`.
- Product requirements, financial-safety architecture, upstream integration review, attendee discovery notes, and release checklist.

## Still not production-ready

### Identity, access and trust
- Email verification, password reset/recovery, revocable refresh sessions, MFA for privileged roles, lockout/credential-stuffing controls, and account lifecycle.
- Fine-grained admin permissions, organiser/business verification, event-scoped gate staff assignment, and complete object-level authorization tests.
- A distributed rate limiter (for example Redis-backed) and proxy-aware trusted client IP configuration for multi-instance deployments.

### Database and operations
- Move from the current SQLite development schema to managed PostgreSQL using reviewed, committed migrations and a tested data migration plan.
- Migration deploy/rollback/recovery, backup/restore drills, database connection management, and production data retention controls.
- Structured request IDs, metrics, alerting, operational dashboards, incident runbooks, and dead-letter/reconciliation jobs.
- CI has not been executed or inspected as passing in this editing session. No local build, test, migration, security scan, or deployment smoke-test result is claimed.

### Ticket commerce and finance
- Atomic expiring inventory reservations, order lifecycle, checkout, and payment provider integration.
- Wire the Paystack adapter into durable order/payment workflows; implement raw-body webhook intake, persistent replay/deduplication, idempotent fulfillment and provider reconciliation.
- Immutable balanced double-entry ledger, negotiated commission snapshots per order, refunds, chargebacks, settlements, and payout controls.
- Ticket issuance after verified payment, attendee ticket wallet, secure QR credentials, event-scoped gate validation, duplicate-scan rejection, and offline scan policy.

### Product interfaces and marketplace
- Attendee checkout, order history, ticket wallet, refunds and account settings.
- Complete organiser portal for event operations, orders, attendee exports, sales reporting and settlement statements.
- Gate staff scanner, admin operations portal, promoter dashboard, advertiser campaign workflow, vendor directory and enquiry workflow.
- Event poster/media uploads, object storage, moderation and notification channels.
- Android/iOS clients and release pipelines.

## Important launch boundary

The event quick-view shows public event details and ticket availability only. It does not reserve inventory, accept payment, or issue an admission ticket. Do not enable live ticket sales until the payment, inventory, ledger, ticket issuance, refund, reconciliation, security and operational acceptance gates have evidence attached.

## Verification

The GitHub Actions workflow is configured, but its current run result has not been verified in this editing session. GitHub commit status results available during this session did not report passing checks. No claim is made that the latest changes compile, pass tests, or are deployed. See [Production Readiness Gate](PRODUCTION_READINESS.md) for release evidence requirements.
