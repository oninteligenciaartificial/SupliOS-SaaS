-- Add email column to profiles (nullable because existing rows may not have it)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" TEXT;