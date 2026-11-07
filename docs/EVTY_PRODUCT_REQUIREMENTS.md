# EVTY Product Requirements

## 1. Product identity and purpose

**Product name:** EVTY  
**Category:** Independent event management, ticketing, and advertising marketplace  
**Launch market:** Nigeria, with international expansion designed into the data model and provider interfaces  
**Delivery approach:** Responsive web application first; native mobile apps later  
**Architecture approach:** Modular monolith for the initial release

EVTY connects attendees, event organisers, promoters, advertisers, event vendors, and gate personnel. The platform owns its brand, customer relationships, ticketing workflows, advertising inventory, commercial agreements, operational data, and reporting.

## 2. Business principles

- EVTY is an independent business, not a division of another brand.
- Organisers negotiate commission rates individually with the platform.
- Commercial rates and terms are recorded as accepted, versioned agreements.
- Core ticketing reliability and trust come before breadth of marketplace features.
- Users may have multiple roles under one account and switch among roles they are authorized to use.
- Platform revenue must be distinguished from ticket GMV, organiser proceeds, taxes, refunds, and processor fees.
- No legal or regulatory compliance claim is made by this product document; counsel and finance specialists must review market-specific operations.

## 3. User roles

One account can hold multiple roles:
- Attendee/customer
- Organiser
- Promoter/affiliate
- Advertiser
- Vendor/service provider
- Gate staff / gate supervisor
- Platform administrator with a scoped permission set

Administrative roles should be scoped: super administrator, finance manager, event manager, advertising manager, customer support, verification manager, technical administrator, gate supervisor, and marketing manager. High-risk actions require authorization and audit logging.

## 4. Functional scope

### 4.1 Identity and onboarding
- Registration by email/password and mobile OTP; OAuth options may be added where configured.
- Secure sessions, account recovery, and role authorization.
- Organiser/business verification separate from basic attendee registration.
- Single account with multiple authorized roles.

### 4.2 Event management
Organisers can create and manage events with title, category, description/programme, poster/media, physical or virtual venue, dates/times, organiser identity, ticket types, inventory, prices, sales period, refund/cancellation policy, and support contact.
- Event states include draft, submitted, approved/published, rejected, suspended, postponed, cancelled, and completed.
- Admins review submissions and can suspend suspected fraudulent events with an audit trail.
- Extensible categories include music/entertainment, celebrations, business, sports, education, culture/community, faith/spirituality, and food/lifestyle.
- Later capabilities: recurring/multi-date events, multi-day passes, reserved seating, group bookings, discount codes, complimentary/invitation tickets, private listings, waitlists, and cancellation/postponement workflows.

### 4.3 Ticket inventory and commerce
- Ticket types include regular, early bird, VIP/VVIP, table/group, season/multi-day, complimentary, staff, press, backstage, reserved seat, donation, and virtual access.
- Organisers may define custom types.
- Inventory must be reserved and decremented safely under concurrent checkout.
- Checkout: event and ticket selection, quantity, attendee details, itemized fee disclosure, payment selection, provider payment, server-side verification, order confirmation, and ticket delivery.
- Saved/tokenized payment methods are only permitted where supported by provider and security requirements.

### 4.4 Negotiated Commission Management System (NCMS)
An organiser requests to sell tickets. EVTY reviews experience, expected volume, category, price, location, marketing, relationship, verification, and risk. The platform proposes terms; organiser may accept, reject, or negotiate. Acceptance creates a durable agreement record.

Agreement fields:
- Organiser and applicable event(s)
- Agreement/version identifier and acceptance record
- Percentage, fixed-per-ticket, or hybrid commission
- Calculation basis, currency, and ticket category applicability
- Effective/expiry dates and any volume/time-limited terms
- Processing-fee arrangement
- Refund/chargeback provisions
- Settlement terms and status

**Contract lock:** For each sale, persist the exact accepted agreement version used. Changes apply only according to contract terms and must not silently alter completed purchases or their accounting.

### 4.5 Payments and finance
- Provider abstraction for Paystack, Flutterwave, and future gateways.
- Verify server-side provider transactions and signed webhooks; reject invalid signatures.
- Idempotent webhook/event handling and reconciliation.
- Ledger entries for customer payment, ticket sale, platform commission, processor fee, service fee, organiser entitlement, promoter reward, refund, chargeback, tax, settlement, and adjustment.
- Support fee arrangements and payout schedules allowed by provider, contract, and law.
- Payment states must distinguish initiated, pending, successful, failed, refunded/partially refunded, disputed/charged back, and settled as appropriate.
- Do not generate admission tickets for unverified payments.
- Do not pay organisers based solely on a client redirect.
- Financial records are append-only/auditable; no erasure of money history.
- Refunds and cancellations reverse the correct entries and invalidate affected tickets.
- Admin routes invoke shared financial services rather than duplicating money logic.

### 4.6 Digital tickets and gate operations
- Each ticket has a unique identifier, secure QR representation, event/order reference, ticket category, attendee info when required, purchase date, validity state, and gate permissions.
- QR/ticket identifiers are cryptographically unpredictable or signed; QR image itself is not proof of admission.
- Server verifies ticket state and performs atomic one-time redemption.
- Detect duplicate scans; maintain staff/device identity and scan activity logs.
- Gate staff only see assigned events and admission data—not organiser financial dashboards.
- Gate permissions can distinguish supervisor, staff, and security.
- Offline mode may use securely downloaded signed ticket data and must define device allocation, sync, conflict, and reconciliation rules. Two offline devices cannot be guaranteed to prevent duplicate entry without a coordination mechanism; high-security events require connected scanners or a venue-local network.

### 4.7 Advertising
Products: homepage takeover/banner, featured event, sponsored search, category sponsorship, video, checkout sponsorship, newsletter, consent-based push campaigns, location-based placements, and event sponsorship matching.
- Advertiser dashboard: account/business verification, campaign, budget, targeting, duration, creatives, payment, approval, reporting, impressions, clicks, conversions, invoice/payment history.
- Pricing options: CPM, CPC, fixed placement, campaign bundle, sponsorship, and agreed conversion pricing.
- Clearly label sponsored placements. Organic rankings must not secretly be pay-to-win.

### 4.8 Promoter/affiliate network
- Promoter registration and verification.
- Eligible event discovery and referral link issuance.
- Attribution of qualified completed purchases.
- Dashboard for links, clicks, conversion, attributed GMV, pending/approved rewards, and payout history.
- Referral reward terms specify who funds it.
- Promoter rewards are accounted separately from organiser commission to prevent duplicate deductions and fraud.

### 4.9 Vendor directory
Initial phase: provider profiles, category, service area, portfolio, indicative prices, availability/contact/enquiry, verification, reviews, and paid/featured visibility.
Categories include venues, decorators, caterers, DJs/bands/artists, MCs, photography/video, sound/stage/lighting, rentals, security, planners, ushers, transport, printing/branding, makeup, and fashion.
Full vendor booking/payment workflows are deferred until core ticketing is proven.

### 4.10 Attendee discovery and retention
- Homepage/search: events today, weekend, trending, upcoming, nearby (with consent/location access), categories, featured/sponsored, recommendations, venues, festivals, international events.
- Filters: country, region/state, city/neighborhood, category, date, price, free/paid, venue, organiser, attendance mode, availability.
- Wishlists, followed organisers, reminders, recommendations, referral offers, verified-purchase reviews, purchase history, and preference-controlled marketing notifications.

### 4.11 Administration, reporting, and operations
- Dashboard metrics: users, organisers, events, tickets, GMV, platform commission, advertising income, vendor income, promoter rewards, expenses.
- Queues and controls: event review, user/organiser verification, ticket inventory, cancellations, payment records, settlements, commissions, refunds, disputes, chargebacks, reconciliation, campaign approvals, content, roles, security alerts, audit logs, system health.
- Filters, pagination, date/market/zone filters, safe exports.
- Every sensitive administrative action is attributable and audited.
- Analytics include GMV, take rate, recognized revenue, conversion, CAC, repeat purchase, active organisers, sell-through, refund/chargeback rates, advertising ROAS, promoter conversion, gate success, settlement time, and customer satisfaction.

## 5. Internationalization and market configuration

Every relevant event/order/payment/settlement records:
- Country and settlement country
- Currency and currency precision
- Payment provider
- Agreement/version applied
- Applicable tax treatment
- Time zone
- Payment/settlement status

Do not hard-code NGN-only assumptions into core models. Do not perform FX conversion using arbitrary rates. A defined currency/FX policy is required. Local payment eligibility, payouts, tax, and regulatory boundaries must be reviewed before enabling each country.

## 6. Security, privacy, and trust
- Least-privilege RBAC and strict tenant/organiser isolation.
- Validation, rate limiting, safe error messages, secure upload controls, and abuse prevention.
- Never log passwords, tokens, API keys, payment secrets, webhook secrets, full government IDs, or unnecessary sensitive data.
- Organiser, advertiser, and vendor verification levels may be basic, business, and enhanced; expose status without exposing private documents.
- Risk-based payout timing and reserves must be transparent before agreement.
- Privacy, retention, deletion/deactivation, data exports, incident response, and market-specific legal documents require formal policy and legal review.

## 7. Delivery roadmap

### Stage 1 — Core ticketing MVP
Foundation and product requirements; identity; organiser verification; event creation/moderation; ticket inventory; orders/checkout; negotiated commission agreement; payment verification; ticket issuance; connected gate scanning; core super-admin controls.

### Stage 2 — Commercial expansion
Advertising dashboard and sponsored events; promoter referral; vendor directory; financial reports; notifications.

### Stage 3 — Testing and controlled launch
Security/payment/load/recovery testing; QR and offline risk tests; refund/cancellation; pilot organisers; event simulations; runbooks and production preparation.

### Stage 4 — Expansion
Android/iOS; international payment providers; multi-country operation; sponsorship marketplace; advanced analytics and recommendations.

Roadmap timing is indicative, not a guarantee.

## 8. Launch acceptance criteria
A controlled launch must demonstrate:
1. Organiser registration and verification.
2. Negotiated commission proposal and recorded acceptance.
3. Event creation, review, approval, and publication.
4. Customer checkout and provider-confirmed payment.
5. Correct contract-version commission calculation.
6. Valid ticket delivery.
7. Successful gate scan and rejection of used/invalid/cancelled ticket.
8. Accurate organiser statements and platform ledger.
9. Refund correctly reverses financial entries and ticket status.
10. Provider-to-platform reconciliation.
11. Unauthorized access to finance/admin functions is denied.
12. Load, security, concurrency, and recovery tests pass.

Attractive UI alone is not launch acceptance.
