-- SIAT Bolivia: campos en organizations + modelo Invoice

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "nitEmisor"         TEXT,
  ADD COLUMN IF NOT EXISTS "razonSocial"       TEXT,
  ADD COLUMN IF NOT EXISTS "siatCuis"          TEXT,
  ADD COLUMN IF NOT EXISTS "siatCuisExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "siatCufd"          TEXT,
  ADD COLUMN IF NOT EXISTS "siatCufdExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "siatNroFactura"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "siatCertExpiry"    TIMESTAMP(3);

CREATE TYPE IF NOT EXISTS "InvoiceStatus" AS ENUM ('PENDIENTE', 'ENVIADO', 'OBSERVADO', 'ANULADO');

CREATE TABLE IF NOT EXISTS "invoices" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "orderId"        TEXT NOT NULL,
  "nroFactura"     INTEGER NOT NULL,
  "cufe"           TEXT,
  "cuis"           TEXT NOT NULL,
  "cufd"           TEXT NOT NULL,
  "nitEmisor"      TEXT NOT NULL,
  "nitReceptor"    TEXT NOT NULL DEFAULT '99999999',
  "razonReceptor"  TEXT NOT NULL,
  "status"         "InvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
  "xmlData"        TEXT,
  "sinResponse"    JSONB,
  "total"          DECIMAL(10,2) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_orderId_key" UNIQUE ("orderId"),
  CONSTRAINT "invoices_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "invoices_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "invoices_organizationId_createdAt_idx"
  ON "invoices"("organizationId", "createdAt");
