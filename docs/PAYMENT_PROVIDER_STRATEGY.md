# EVTY payment provider strategy

## Provider routing

- **Primary provider: OPay Nigeria hosted Cashier checkout** for customer-facing NGN payments.
- **Secondary provider: Paystack** remains integrated as an independently configurable provider for test/acceptance and controlled fallback. It must not be selected automatically after an ambiguous OPay timeout: first reconcile the OPay reference to avoid charging the customer twice.
- Provider selection is server-side only. A client must never submit arbitrary provider credentials or override the platform's provider policy.
- OPay is the default provider only when the merchant credentials and activation flag are present. Until OPay merchant onboarding, credentials, callback configuration and joint testing are complete, checkout must remain disabled rather than silently charge through a different provider.

## OPay adapter

`src/domain/payments/opay.ts` implements the Nigeria hosted Cashier integration:
- Staging create endpoint: `https://testapi.opaycheckout.com/api/v1/international/cashier/create`.
- Production create endpoint: `https://liveapi.opaycheckout.com/api/v1/international/cashier/create`.
- Cashier creation uses the merchant Public Key and MerchantId headers.
- Payment status verification signs the exact serialized JSON request body using HMAC-SHA512 and the private key.
- Callback verification uses OPay's documented HMAC-SHA3-512 signature string and constant-time digest comparison.
- Amounts are integer NGN minor units (kobo); provider amount/currency/reference must match before fulfillment.
- Hosted checkout URL is restricted to HTTPS OPay cashier hosts.

Official references:
- https://documentation.opaycheckout.com/cashier-create.html
- https://documentation.opaycheckout.com/payment-authentication.html
- https://documentation.opaycheckout.com/query-payment-status.html
- https://documentation.opaycheckout.com/payment-notifications-callbacks.html
- https://documentation.opaycheckout.com/callback-signature.html
- https://documentation.opaycheckout.com/payment-refund.html

## Paystack adapter

The existing `src/domain/payments/paystack.ts` remains available as a secondary provider adapter. Keep its test and live keys separate. Verify successful transactions server-side and compare status, reference, amount and currency before delivering tickets or other value.

Official references:
- https://paystack.com/docs/api/transaction/
- https://paystack.com/docs/payments/verify-payments/
- https://paystack.com/docs/payments/webhooks/

## Render environment variables

Configure these in the API service only; never add secrets to Git, web/mobile builds, CI logs or chat:
- `PAYMENT_PRIMARY_PROVIDER=opay`
- `PAYMENT_SECONDARY_PROVIDER=paystack`
- `OPAY_ENABLED=false` until merchant onboarding and joint testing are complete; enable only after acceptance.
- `OPAY_ENV=test` for staging; use `live` only after OPay approves production credentials.
- `OPAY_MERCHANT_ID`
- `OPAY_PUBLIC_KEY`
- `OPAY_PRIVATE_KEY`
- `OPAY_CALLBACK_URL=https://evty-api.onrender.com/api/v1/payments/opay/webhook`
- `OPAY_RETURN_URL=https://evty-web.onrender.com/payment/return`
- `OPAY_CANCEL_URL=https://evty-web.onrender.com/payment/cancel`
- `PAYSTACK_SECRET_KEY` (test key first)
- `PAYSTACK_WEBHOOK_SECRET`
- `PAYSTACK_CALLBACK_URL=https://evty-web.onrender.com/payment/return`

No credentials are present in the repository and no live payment is enabled by this change.

## Important remaining integration gates

The current application does not yet have a durable, fully wired order/payment workflow. Provider adapters alone do not constitute a working checkout. Before accepting funds EVTY must implement and test:
1. PostgreSQL order, payment attempt, provider event/inbox and idempotency records.
2. Atomic, expiring ticket inventory reservations and release on expiry/failure.
3. Durable payment states and immutable provider references.
4. Raw-body callback route, callback signature validation, durable deduplication and asynchronous processing.
5. Server-to-server provider status verification and strict reference/amount/currency/merchant matching.
6. Exactly-once ticket issuance and balanced double-entry ledger posting only after verified success.
7. Refund and reversal handling, chargebacks, promoter commissions, organiser settlement and payout approvals.
8. Daily provider reconciliation and alerting for unmatched/late/duplicate transactions.

Do not enable live ticket sales until these controls and provider joint acceptance testing pass. OPay merchant onboarding, production credentials, available collection methods, fees and settlement arrangements must be confirmed directly with OPay.
