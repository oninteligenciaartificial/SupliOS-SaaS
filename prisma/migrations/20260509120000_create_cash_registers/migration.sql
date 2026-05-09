-- CreateTable: cash_registers
-- Tracks daily cash register closes per organization/branch.
-- Already applied to Supabase production DB on 2026-05-09.

CREATE TABLE "cash_registers" (
  "id"                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId"        TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "staffId"               TEXT REFERENCES "profiles"("id") ON DELETE SET NULL,
  "branchId"              TEXT REFERENCES "branches"("id") ON DELETE SET NULL,
  "date"                  DATE NOT NULL,
  "totalEfectivo"         DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalTarjeta"          DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalTransferencia"    DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalQr"               DECIMAL(10,2) NOT NULL DEFAULT 0,
  "montoRealEfectivo"     DECIMAL(10,2),
  "diferencia"            DECIMAL(10,2),
  "notas"                 TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "cash_registers_org_date_idx"
  ON "cash_registers" ("organizationId", "date" DESC);

-- Unique: one close per org per day (no branch)
CREATE UNIQUE INDEX "cash_registers_org_date_branch_null_idx"
  ON "cash_registers" ("organizationId", "date")
  WHERE "branchId" IS NULL;

-- Unique: one close per org per day per branch
CREATE UNIQUE INDEX "cash_registers_org_date_branch_idx"
  ON "cash_registers" ("organizationId", "date", "branchId")
  WHERE "branchId" IS NOT NULL;
