# EVTY Implementation Status

This file separates repository implementation from product ambition. Update it as code and tests are delivered.

## Foundation landed

- TypeScript/Node API package, development/build/test scripts.
- Express API bootstrap with Helmet, bounded JSON body parsing, configured CORS, safe generic error response, graceful shutdown.
- Liveness endpoint `GET /health` and database check `GET /health/db`.
- Prisma relational schema baseline for users, events, ticket types, orders, order items, tickets, ledger entries, commission agreements, promoter attribution and audit logs.
- Initial event listing and event draft creation endpoints with request validation.
- Integer minor-unit money helper and unit tests.
- Environment example and ignore rules.

## Not yet production-ready

Authentication and session/token lifecycle; server-side role and object authorization; organizer/event staff permissions; production database choice and migrations; secure ticket QR generation and admission transaction; payment provider adapter and webhook verification; atomic inventory reservation; complete double-entry ledger and reconciliation; refund and settlement workflows; commissions/promoter payout; ads/vendor modules; notification delivery; admin UI; web/mobile clients; full OpenAPI contract; CI/CD; security/performance/accessibility tests; production deployment and signed Android/iOS releases.

The event-create route currently accepts an organizer ID without authentication. It is a development foundation only and MUST NOT be exposed to production or treated as secured until authentication and organizer authorization middleware are implemented and tested.

## Verification

Run `npm install`, `npm run db:generate`, `npm run build`, and `npm test`. Configure a real deployment environment and perform migrations and end-to-end tests before release. Do not state these commands passed unless executed in the target environment.
