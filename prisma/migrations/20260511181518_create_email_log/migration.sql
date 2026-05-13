-- Create email_logs table
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "to" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "brevoMessageId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for common queries
CREATE INDEX "email_logs_organizationId_createdAt_idx" ON "email_logs"("organizationId", "createdAt");
CREATE INDEX "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt");
CREATE INDEX "email_logs_type_createdAt_idx" ON "email_logs"("type", "createdAt");
