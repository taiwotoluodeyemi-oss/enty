# Paystack secondary provider integration boundary

Paystack is retained as EVTY's secondary payment provider. OPay is the primary provider for Nigeria NGN transactions. Do not automatically retry an ambiguous OPay transaction through Paystack; reconcile the original provider reference first to avoid duplicate customer charges.

## Implemented adapter

`src/domain/payments/paystack.ts` provides a server-side Paystack client for transaction initialization and verification. It validates integer minor-unit amounts, ISO currency codes, references, and the returned hosted checkout URL. It also verifies the timestamped `Paystack-Signature` format using raw request bytes, a five-minute replay window, constant-time comparison, and multiple candidate secrets for secret rotation. A legacy `x-paystack-signature` verifier is included for controlled migration.

The adapter follows Paystack's official transaction and webhook guidance:
- https://paystack.com/docs/api/transaction/
- https://paystack.com/docs/payments/webhooks/
- https://paystack.com/docs/payments/verify-payments/

## Required deployment secrets

Set these only in the API deployment's secret manager; never in the web app, mobile bundle, or repository:
- `PAYSTACK_SECRET_KEY`: test key for sandbox acceptance; live key only after all release gates pass.
- `PAYSTACK_WEBHOOK_SECRET`: dedicated webhook signing secret from Paystack dashboard. Support overlap/rotation by supplying all currently valid webhook secrets through deployment secret management.
- `PAYSTACK_CALLBACK_URL`: HTTPS URL on the EVTY web app for user return after checkout.

Use the Paystack test key and test dashboard mode for acceptance testing. Never use a live secret in CI.

## Not yet wired to customer checkout

This adapter is not yet connected to an order/reservation/payment database workflow. It does not issue tickets, post ledger entries, refund customers, or settle organisers. Do not expose a pay button or accept customer funds on the strength of this adapter alone.

Before wiring it into checkout, EVTY still needs:
1. PostgreSQL schema and reviewed migrations for reservations, payments, webhook deduplication and ticket lifecycle.
2. Atomic inventory reservation and expiry/release handling.
3. Idempotent order and payment state transitions.
4. Provider verification matched against order reference, amount, currency, customer and merchant account.
5. Transactional ticket issuance and balanced ledger posting after verification only.
6. Webhook raw-body capture, durable event deduplication, reconciliation and operational replay.
7. Refund, chargeback and organiser settlement workflows.

The provider priority is OPay primary and Paystack secondary. This is configuration and adapter readiness, not evidence that EVTY has an OPay or Paystack merchant account, production credentials or provider approval. Confirm merchant onboarding, settlement model, fees, chargeback/refund rules and contractual terms before live mode.
