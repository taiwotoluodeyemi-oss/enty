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
- GitHub Actions workflow for Prisma validation/client generation, API build/tests, and web lint/build on pushes and pull requests to `main`. Run #84 at commit `6275d3df131340264da14f9d87216690518bd6b6` passed all three jobs: API build/tests, web lint/production build, and PostgreSQL schema/baseline migration verification against disposable PostgreSQL 16.
- Product requirements, financial-safety architecture, upstream integration review, attendee discovery notes, and release checklist.

## Infrastructure and database migration groundwork

- Render Free PostgreSQL 18 test database `evty-dev-postgres` was provisioned in the `Taiwo's workspace` on 2026-11-13 and confirmed available. It is temporary and scheduled to expire on 2026-12-13. See [temporary PostgreSQL test database runbook](POSTGRESQL_TEST_DATABASE.md).
- Added a separate PostgreSQL Prisma schema and initial baseline migration under `prisma/postgresql/`, plus `db:pg:validate`, `db:pg:generate`, and `db:pg:deploy` scripts.
- Added a PostgreSQL CI job using a disposable PostgreSQL 16 service to validate and apply the baseline migration.
- The API's default Prisma schema remains SQLite. The PostgreSQL migration has not been verified against the Render instance, the API is not connected to it, and no runtime database cutover is claimed.
- CI verification is now green at commit `6275d3df131340264da14f9d87216690518bd6b6`: API build/tests, web lint/production build, and PostgreSQL baseline migration verification passed. Render API deployment of this commit is live and the server startup log reports port 10000. The Render PostgreSQL 18 instance remains unconnected; no API/database health endpoint probe, security audit clearance, load test, or production smoke test is claimed.

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


## Latest deployment verification — 2026-11-14

- Render service `evty-api` deployed commit `6275d3df131340264da14f9d87216690518bd6b6` successfully and is `live` at `https://evty-api.onrender.com`.
- Startup log confirms `server_started` on Render-assigned port `10000`.
- `JWT_SECRET`, `CORS_ORIGIN`, and `NODE_ENV=production` are configured in Render environment variables. Secret values are not stored in Git.
- The API still uses the SQLite Prisma schema and does not yet use the temporary Render PostgreSQL instance.
- Latest Render npm install reported 7 API dependency vulnerabilities (1 moderate, 4 high, 2 critical). Resolve and verify these before any production release.
