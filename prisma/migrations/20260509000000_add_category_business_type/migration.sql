-- Add businessType column to categories
ALTER TABLE "categories" ADD COLUMN "businessType" TEXT NOT NULL DEFAULT 'GENERAL';
