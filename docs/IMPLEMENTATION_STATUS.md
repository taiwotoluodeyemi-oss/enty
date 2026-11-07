# EVTY Implementation Status

This file separates repository implementation from product ambition. Update it as code and tests are delivered.

## Foundation landed

- TypeScript/Node API package, development/build/test scripts.
- Express API bootstrap with Helmet, bounded JSON body parsing, configured CORS, safe generic error response, graceful shutdown.
- Liveness endpoint `GET /health` and database check `GET /health/db`.
- Prisma relational schema baseline for users, events, ticket types, orders, order items, tickets, ledger entries, commission agreements, promoter attribution and audit logs.
- Initial event listing endpoint restricted to published events.
- Integer minor-unit money helper and unit tests.
- Environment example and ignore rules.
- Account registration and login endpoints using bcrypt password hashing and short-lived signed JWT access tokens.
- Event creation requires a valid bearer token and the ORGANIZER role. The organizer ID is derived from the verified token, not request input.
- Production startup refuses to run without a configured JWT secret of at least 32 characters.

## Still not production-ready

This is an initial backend foundation, not a complete launch-ready product. Remaining work includes:

- Authentication hardening: rate limits, email verification, password reset, refresh-token/session revocation, MFA for privileged users, and account lockout protections.
- Authorization and moderation: organizer membership, event staff permissions, organizer verification, admin permissions, event publishing/review, and object-level authorization coverage.
- Database: production PostgreSQL configuration, committed Prisma migrations, backup/restore drills, migration rollback/recovery plan, and production data policies.
- Ticketing: atomic inventory reservation, order lifecycle, secure QR token issuance, duplicate-scan prevention, gate staff access, offline scan reconciliation, and attendee ticket views.
- Payments and money: provider adapters, trusted server-side payment verification, signed webhook handling, idempotency, double-entry ledger invariants, reconciliation, refunds, settlement, commission and promoter payout controls.
- Marketplace: promotions, advertiser products, vendor listings, notifications, dispute and support workflows.
- Interfaces: a separate `web/` Next.js discovery UI starter now exists with responsive editorial styling, search input, category filtering, illustrative event cards, and a host CTA. It is not yet API-connected and does not implement attendee checkout, organizer workflows, gate staff, admin web experiences, or mobile clients.
- Operations: structured request logging and correlation IDs, metrics, alerting, runbooks, incident response, privacy and retention controls, CI quality gates, deployment configuration and end-to-end tests.
- Security, load, accessibility, and payment-provider certification testing.

## Verification

The web design foundation and documentation updates have been committed to the GitHub `main` branch through the repository API. This environment has not run either the API or web project build, tests, database migrations, security tests, or deployment smoke tests. No local Git checkout/commit was available in this environment. Run `npm install`, `npm run db:generate`, `npm run build`, and `npm test` in a controlled environment, then test against a production-like PostgreSQL database and payment-provider sandbox before any release.

Do not represent this repository as production-ready until these checks pass and the listed critical workflows have been implemented and independently reviewed.
