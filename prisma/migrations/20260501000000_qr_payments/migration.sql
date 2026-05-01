-- Rename AddonType enum value MERCADOPAGO -> QR_BOLIVIA
ALTER TYPE "AddonType" RENAME VALUE 'MERCADOPAGO' TO 'QR_BOLIVIA';

-- Create QrPaymentStatus enum
CREATE TYPE "QrPaymentStatus" AS ENUM ('PENDIENTE', 'PAGADO', 'EXPIRADO', 'CANCELADO', 'FALLIDO');

-- Create qr_payments table
CREATE TABLE "qr_payments" (
    "id"                 TEXT NOT NULL,
    "organizationId"     TEXT NOT NULL,
    "orderId"            TEXT NOT NULL,
    "provider"           TEXT NOT NULL,
    "externalId"         TEXT NOT NULL,
    "qrPayload"          TEXT NOT NULL,
    "qrImageUrl"         TEXT,
    "amount"             DECIMAL(10,2) NOT NULL,
    "currency"           TEXT NOT NULL DEFAULT 'BOB',
    "status"             "QrPaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "expiresAt"          TIMESTAMP(3) NOT NULL,
    "paidAt"             TIMESTAMP(3),
    "payerInfo"          JSONB,
    "providerResponse"   JSONB,
    "webhookReceivedAt"  TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_payments_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "qr_payments"
    ADD CONSTRAINT "qr_payments_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "qr_payments"
    ADD CONSTRAINT "qr_payments_orderId_fkey"
    FOREIGN KEY ("orderId")
    REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique + indexes
CREATE UNIQUE INDEX "qr_payments_provider_externalId_key"
    ON "qr_payments"("provider", "externalId");

CREATE INDEX "qr_payments_organizationId_createdAt_idx"
    ON "qr_payments"("organizationId", "createdAt");

CREATE INDEX "qr_payments_orderId_status_idx"
    ON "qr_payments"("orderId", "status");

CREATE INDEX "qr_payments_status_expiresAt_idx"
    ON "qr_payments"("status", "expiresAt");
