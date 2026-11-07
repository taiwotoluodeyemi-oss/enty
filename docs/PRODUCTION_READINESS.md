# Production Readiness Gate

This is a release checklist, not a statement that the application already satisfies every item. EVTY's current repository is a starter foundation; a passing CI workflow alone does not establish production readiness.

## Release-blocking implementation and evidence

- [ ] Replace the SQLite development datasource with managed PostgreSQL and commit reviewed Prisma migrations.
- [ ] Implement complete user lifecycle: email verification, recovery, revocable sessions, rate limits, lockout protections, and MFA for privileged roles.
- [ ] Complete organizer verification, event moderation/publishing, role permissions, and resource-level authorization tests.
- [ ] Implement order creation and expiring inventory reservations with atomic concurrency-safe capacity enforcement.
- [ ] Implement payment provider adapters; verify provider status, amount, currency, and reference server-side. Verify webhook signatures, replay defense, and idempotency.
- [ ] Enforce balanced, immutable ledger posting and reconciliation. Test duplicate callbacks, partial/full refunds, chargebacks, payout failures, and recovery.
- [ ] Issue ticket credentials only after confirmed payment. Implement atomic QR redemption, gate/event staff permissions, duplicate scan rejection, and explicit offline sync conflict handling.
- [ ] Integrate the web UI with real API data and implement attendee checkout, organizer, gate, and admin workflows. Remove or clearly label illustrative event data.
- [ ] Add request rate limits, secure headers/CORS policy, payload validation, safe file handling, privacy-safe logs, audit trails, and dependency/security scanning.
- [ ] Add operational metrics, alerting, outbox/retry/dead-letter handling, runbooks, backup and restore drills, and tested rollback.
- [ ] Complete accessibility, performance/load, security, and payment-provider sandbox acceptance tests.
- [ ] Obtain appropriate legal/accounting review for Nigerian payments, funds flow, tax, privacy, terms, and organizer agreements.

## Release evidence to attach

Record the commit SHA and environment, CI results, migration result, test reports, payment sandbox scenarios, load profile and results, backup restore evidence, operational owner, rollback procedure, and known limitations. Do not use production customer funds or live ticket inventory for acceptance testing.

## Current repository scope

The API currently includes registration/login, a published-event listing, and authenticated organizer draft-event creation. The separate Next.js web workspace is an illustrative event-discovery starter and is not integrated with checkout or organizer operations. See [Implementation Status](IMPLEMENTATION_STATUS.md) and [Architecture & Financial Safety](ARCHITECTURE_AND_FINANCIAL_SAFETY.md).
