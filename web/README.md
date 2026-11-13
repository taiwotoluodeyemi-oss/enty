# EVTY Web — event discovery

This Next.js App Router workspace provides the EVTY public discovery experience. The homepage reads published events from the EVTY API, including the lowest currently saleable ticket price. Event detail pages show venue, schedule, ticket options, and live availability.

## Run locally

Start the API from the repository root, then configure and start the web client:

```bash
# repository root
npm install
npm run dev
```

In `web/.env.local`, set:

```env
NEXT_PUBLIC_EVTY_API_URL=http://localhost:4000/api/v1
```

The API must allow the web origin through its `CORS_ORIGIN` configuration. In production, set `NEXT_PUBLIC_EVTY_API_URL` to the deployed EVTY API URL and configure the API CORS allowlist to the exact deployed web origin.

## Current boundaries

- Event discovery and event details use live API data. No illustrative hard-coded event inventory is presented as real listings.
- The event detail page displays ticket prices and availability but does not accept orders.
- Checkout, verified payment webhooks, inventory reservation/expiry, ticket issuance, QR redemption, refunds, and organiser settlement are not enabled yet.
- Organiser sign-in, event authoring UI, admin moderation UI, promoter, advertiser, vendor, and gate-staff portals still need to be implemented and tested against the API.
- Do not enable real-money checkout until provider verification, ledger invariants, idempotency, concurrency controls, reconciliation, and security tests pass.

The supplied Eventra archive remains a visual reference only. EVTY retains its independent identity, data model, and financial rules.
