-- Initial EVTY schema. Generated to match prisma/schema.prisma.
-- Existing SQLite databases created with db push must be backed up and baselined
-- before applying this migration; never run this against a populated unbaselined DB.
PRAGMA foreign_keys=OFF;

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ATTENDEE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "User_role_check" CHECK ("role" IN ('ATTENDEE','ORGANIZER','PROMOTER','ADVERTISER','VENDOR','GATE_STAFF','ADMIN'))
);

CREATE TABLE "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "venueName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "endsAt" DATETIME NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Event_status_check" CHECK ("status" IN ('DRAFT','PENDING_REVIEW','PUBLISHED','CANCELLED','COMPLETED')),
  CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TicketType" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceMinor" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "salesStart" DATETIME,
  "salesEnd" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attendeeId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  "currency" TEXT NOT NULL,
  "totalMinor" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerRef" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Order_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "ticketTypeId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceMinor" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderItemId" TEXT NOT NULL,
  "qrTokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'VALID',
  "admittedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ticket_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionKey" TEXT NOT NULL,
  "accountCode" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "entryType" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CommissionAgreement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizerId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "rateBasisPoints" INTEGER NOT NULL,
  "fixedFeeMinor" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL,
  "acceptedAt" DATETIME,
  "effectiveFrom" DATETIME NOT NULL,
  "effectiveTo" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PromoterAttribution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "promoterId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "referralCode" TEXT NOT NULL,
  "attributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orderId" TEXT,
  "commissionMinor" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");
CREATE INDEX "Event_organizerId_createdAt_idx" ON "Event"("organizerId", "createdAt");
CREATE INDEX "TicketType_eventId_idx" ON "TicketType"("eventId");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE UNIQUE INDEX "Order_providerRef_key" ON "Order"("providerRef");
CREATE INDEX "Order_attendeeId_createdAt_idx" ON "Order"("attendeeId", "createdAt");
CREATE INDEX "Order_eventId_status_idx" ON "Order"("eventId", "status");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "Ticket_qrTokenHash_key" ON "Ticket"("qrTokenHash");
CREATE INDEX "Ticket_status_admittedAt_idx" ON "Ticket"("status", "admittedAt");
CREATE INDEX "LedgerEntry_transactionKey_idx" ON "LedgerEntry"("transactionKey");
CREATE INDEX "LedgerEntry_accountCode_currency_createdAt_idx" ON "LedgerEntry"("accountCode", "currency", "createdAt");
CREATE UNIQUE INDEX "CommissionAgreement_organizerId_version_key" ON "CommissionAgreement"("organizerId", "version");
CREATE UNIQUE INDEX "PromoterAttribution_orderId_key" ON "PromoterAttribution"("orderId");
CREATE INDEX "PromoterAttribution_promoterId_eventId_idx" ON "PromoterAttribution"("promoterId", "eventId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

PRAGMA foreign_keys=ON;
