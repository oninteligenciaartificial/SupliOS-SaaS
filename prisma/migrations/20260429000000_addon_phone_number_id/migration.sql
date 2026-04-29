-- Add phoneNumberId to OrgAddon for WhatsApp multi-tenant routing
ALTER TABLE "org_addons" ADD COLUMN "phoneNumberId" TEXT;
