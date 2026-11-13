# Production Readiness Gate

This is a release checklist, not a statement that EVTY already satisfies every item. EVTY is not approved for live ticket sales until all applicable release-blocking controls below are implemented and evidenced.

## Release-blocking implementation and evidence

- [ ] Replace SQLite with managed PostgreSQL; a fresh-database SQLite baseline is now checked in, but the PostgreSQL migration and tested data migration/recovery plan remain outstanding.
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
- [ ] Obtain appropriate legal/accounting review for Nigerian payments, funds flow, tax, privacy, terms, consumer refunds and organiser agreements.

## Current attendee event experience

The homepage and all-events directory load published event data from the EVTY API. Users can search/filter, open a responsive quick-view dialog, inspect event details and ticket availability, and navigate to the full event page. This is discovery only: ticket availability is informational and is not a stock reservation. Checkout and ticket issuance are not enabled by the quick-view feature.

## Verification evidence required

Record the commit SHA and environment, CI results, migration result, test reports, payment sandbox scenarios, load profile/results, backup restore evidence, operational owner, rollback procedure, and known limitations. Do not use production customer funds or live ticket inventory for acceptance testing.

## Known current limitations

- The Prisma datasource is currently SQLite. An initial SQLite migration and database runbook are committed; PostgreSQL migration/cutover is not yet implemented or tested.
- Authentication rate limiting is currently process-local; multi-instance production requires a shared store.
- Payment provider, merchant account, fee/funds-flow terms, commission policy, payout rules and launch market require explicit configuration and review.
- GitHub Actions now applies the checked-in migration to a fresh SQLite database before build/tests; the latest run has not yet been reported by GitHub, so migration/build/test success remains unverified.
- No local build, test, migration, security, load, or deployment smoke-test result is claimed.

A successful CI run is necessary but not sufficient for release. Do not represent EVTY as production-ready until the critical workflows above are implemented, independently reviewed and verified in a production-like environment.
