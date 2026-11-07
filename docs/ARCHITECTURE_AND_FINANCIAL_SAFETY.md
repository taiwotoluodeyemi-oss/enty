# EVTY Architecture & Financial Safety

## Architecture posture

Use a **modular monolith** for the first release. Keep module boundaries explicit and use shared domain services for state transitions and financial operations. Extract services only when scale or operational needs justify it.

The blueprint's preferred stack:
- Web: Next.js / React
- API: Node.js / NestJS
- Relational store: PostgreSQL
- Cache/queues: Redis
- Object/media storage: S3-compatible storage
- Payments: provider adapters (Paystack, Flutterwave, later providers)
- Authentication: secure session management, OTP and OAuth where supported
- Messaging: email, SMS, WhatsApp (approved integration), push
- API docs: OpenAPI/Swagger
- Mobile: React Native or Flutter after web-first product validation

These are recommendations. Inspect existing repository dependencies and conventions before deciding to introduce or replace frameworks.

## Suggested bounded modules

1. Identity & access
2. Organisers & verification
3. Events & moderation
4. Ticket catalogue & inventory
5. Orders & checkout
6. Payment adapters & webhook intake
7. Commission agreements (NCMS)
8. Financial ledger & settlements
9. Ticket issuance
10. Gate validation
11. Advertising
12. Promoter attribution
13. Vendor directory
14. Notifications
15. Reviews & analytics
16. Admin, audit, trust & safety

## Critical workflows

### Purchase and issue
1. Create an order with an idempotency key.
2. Reserve inventory atomically with an expiry.
3. Initiate payment through provider adapter.
4. Receive provider callback/webhook.
5. Verify signature and independently verify transaction status/amount/currency/reference.
6. Enforce idempotency and legal order/payment state transition.
7. Apply the immutable accepted commission agreement version.
8. Post balanced ledger entries in one database transaction with the order/payment state update.
9. Issue unique tickets only after confirmed payment.
10. Deliver tickets asynchronously; notification failure must not roll back a confirmed sale.
11. Reconcile provider reports against platform records.

### Refund/cancellation
- Authorize action according to event policy, contract, role, and provider state.
- Call shared refund service; use provider idempotency where available.
- Record refund and balancing ledger entries; do not delete original entries.
- Invalidate refunded ticket(s).
- Support partial refund semantics where the provider and ticket model allow.
- Reconcile refund result; handle pending/failed outcomes explicitly.

### Organiser settlement
- Calculate payable amount from ledger, contract, reserves, refund/chargeback exposure, provider restrictions, and approved payout schedule.
- Validate settlement destination changes and apply enhanced verification.
- Record payout initiation, provider reference, completion/failure, and reconciliation.
- Never allow admin UI to directly edit balances.

### Gate validation
- Authenticate staff/device and event assignment.
- Validate event, ticket signature/identifier, ticket status, gate permissions, and event time rules.
- Atomically mark redeemed, rejecting duplicate redemption.
- Record device/staff, timestamp, gate, and outcome.
- Offline operation must have explicit risk boundaries and sync/conflict policy.

## Financial ledger invariants

- Money values use integer minor units with explicit currency precision; never use binary floating point for financial calculations.
- Ledger entries are immutable. Corrections are new reversal/adjustment entries with reason, actor, and reference.
- Each posting batch balances debits and credits.
- Unique constraints/idempotency prevent duplicate webhook, payment, commission, refund, ticket, and settlement processing.
- Commission is calculated using the stored agreement version and defined basis.
- Processor fees, platform service fees, organiser entitlement, promoter reward, tax, refunds, chargebacks, and settlements are separate accounting concepts.
- Provider split-payment records are reconciled with EVTY's own ledger; provider data is not the only book of record.
- Pending payment is not revenue; GMV, platform revenue, organiser proceeds, taxes, and refunds are reported separately.
- Financial state transitions and ledger posting should be transactional wherever possible.

## Security controls

- RBAC plus resource ownership/organiser isolation on every API operation.
- Secure cookie/session defaults, CSRF protections where applicable, password hashing, account recovery controls, and rate limits.
- Validate input, file type/size, URLs, and payment/webhook payloads.
- Webhook signature verification, replay protection, bounded retries, and dead-letter visibility.
- Audit sensitive admin, commercial, verification, settlement, refund, and ticket override actions.
- Safe structured logs; exclude credentials, secrets, full payment details, government IDs, and unnecessary personal data.
- Encrypt sensitive data in transit and at rest; manage keys/secrets outside source control.
- Security and legal review required before production.

## Notifications and event delivery

Use an outbox pattern where possible: create event/outbox record transactionally with domain state changes, then deliver asynchronously. Delivery failures must not roll back ticket or money state. Model pending, processing, delivered, retrying, and dead-letter states. Use bounded retries with backoff, event IDs, duplicate protection, and operational replay controls.

## Reliability and operations

- Health endpoints for app, database, and configured dependencies.
- Structured request logs with correlation IDs and safe actor/organisation metadata.
- Metrics for request latency/errors, payment outcomes, order/ticket issuance, refunds, settlement, gate scan outcomes, queue depth, webhook delivery, and stuck workflows.
- Backups, restore tests, deployment rollback, incident runbooks, and reconciliation jobs.
- Monitor stuck inventory reservations, pending payments, failed webhooks, unissued paid tickets, unbalanced ledger batches, failed settlements, and duplicate scan patterns.

## Decisions requiring verification before coding/launch

- Inspect existing codebase and deployment constraints.
- Confirm merchant-of-record and funds flow with payment providers and Nigerian payments counsel.
- Confirm provider capabilities/eligibility for per-organiser negotiated splits, currencies, refunds, and settlement timing.
- Define privacy/data retention and legal documents with counsel.
- Define offline scanning risk acceptance for each event class.
- Establish accounting policy for fees, tax, FX, refunds, and revenue recognition.
