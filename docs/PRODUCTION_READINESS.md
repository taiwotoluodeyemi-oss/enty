# Production Readiness Gate

This is a release checklist, not a statement that EVTY already satisfies every item. EVTY is not approved for live ticket sales until all applicable release-blocking controls below are implemented and evidenced.

## Release-blocking implementation and evidence

- [ ] Replace SQLite with managed PostgreSQL; a temporary Render Free PostgreSQL 18 test database has been provisioned, but it is not connected. The PostgreSQL baseline migration passed CI against a fresh PostgreSQL 16 service; it still must be run and verified against the Render PostgreSQL 18 instance before API cutover.
- [ ] Complete email verification, password recovery, revocable sessions, rate limits backed by shared storage, lockout protections and privileged-user MFA.
- [ ] Complete organiser/business verification, fine-grained admin permissions, event-scoped gate staff assignment and object-level authorization tests.
- [ ] Implement expiring inventory reservations and atomic concurrency-safe capacity enforcement.
- [ ] Implement checkout and a selected, contracted payment provider. Verify transaction status, reference, amount, currency and merchant account server-side.
- [ ] Verify signed webhooks with replay defense, idempotency and reconciliation.
- [ ] Enforce immutable balanced ledger posting and versioned accepted commission terms. Test duplicate callbacks, partial/full refunds, chargebacks, payout failures and recovery.
- [ ] Issue tickets only after confirmed payment. Implement attendee ticket wallet, unique QR credentials, atomic event-scoped redemption, duplicate-scan rejection and a documented offline policy.
- [ ] Implement attendee checkout/account/ticket/refund interfaces and complete organiser, gate, admin, promoter, advertiser and vendor portals.
- [ ] Add secure event image/media uploads, object storage, content validation and moderation.
- [ ] Add structured request logs, correlation IDs, operational metrics, alerting, outbox/retry/dead-letter handling, runbooks, backup/restore drills and tested rollback.
- [ ] Complete accessibility, performance/load, dependency/security, payment-provider sandbox and end-to-end acceptance tests.
- [ ] Resolve the latest dependency audit findings before production: Render API install reported 7 vulnerabilities (1 moderate, 4 high, 2 critical); web CI install reported 8 vulnerabilities (7 moderate, 1 high).
- [ ] Obtain appropriate legal/accounting review for Nigerian payments, funds flow, tax, privacy, terms, consumer refunds and organiser agreements.

## Current attendee event experience

The homepage and all-events directory load published event data from the EVTY API. Users can search/filter, open a responsive quick-view dialog, inspect event details and ticket availability, and navigate to the full event page. This is discovery only: ticket availability is informational and is not a stock reservation. Checkout and ticket issuance are not enabled by the quick-view feature.

## Verification evidence required

Record the commit SHA and environment, CI results, migration result, test reports, payment sandbox scenarios, load profile/results, backup restore evidence, operational owner, rollback procedure, and known limitations. Do not use production customer funds or live ticket inventory for acceptance testing.

## Known current limitations

- The Prisma datasource is currently SQLite. A temporary Render PostgreSQL 18 test database exists and is scheduled to expire on 2026-12-13; it is not connected. PostgreSQL migration/cutover is not yet implemented or tested. See [temporary PostgreSQL test database runbook](POSTGRESQL_TEST_DATABASE.md).
- Authentication rate limiting is currently process-local; multi-instance production requires a shared store.
- Payment provider, merchant account, fee/funds-flow terms, commission policy, payout rules and launch market require explicit configuration and review.
- GitHub Actions run #84 at commit `6275d3df131340264da14f9d87216690518bd6b6` passed API build/tests, web lint/production build, and PostgreSQL schema/baseline migration verification on a fresh PostgreSQL 16 service. This does not prove the Render PostgreSQL 18 database has been migrated or that the API has been cut over.
- CI build, unit tests, web lint/build, and PostgreSQL baseline migration checks are verified as passing at the commit above. Render API deployment is live and its startup log is successful. No API `/health` or `/health/db` probe, Render PostgreSQL 18 migration, security audit clearance, load test, backup/restore drill, or production end-to-end smoke test is claimed.

A successful CI run is necessary but not sufficient for release. Do not represent EVTY as production-ready until the critical workflows above are implemented, independently reviewed and verified in a production-like environment.


## Latest deployment evidence — 2026-11-14

- Render `evty-api` is live at `https://evty-api.onrender.com` on commit `6275d3df131340264da14f9d87216690518bd6b6`; Node.js 22 build succeeded and the server logged startup on port 10000.
- Render API environment now includes a generated JWT signing secret, `NODE_ENV=production`, and `CORS_ORIGIN=https://evty-web.onrender.com`.
- This is a deployment smoke indicator only; HTTP health endpoints and database health have not yet been independently probed.
