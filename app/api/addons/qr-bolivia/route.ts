import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseAddon } from "@/lib/plans";
import type { AddonType } from "@/lib/plans";

// GET /api/addons/qr-bolivia — returns uploaded QR image URL if available
export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const addons = await prisma.orgAddon.findMany({
    where: { organizationId: profile.organizationId, active: true },
    select: { addon: true, phoneNumberId: true },
  });
  const activeAddons = addons.map((a) => a.addon as AddonType);

  if (!canUseAddon(activeAddons, "QR_BOLIVIA")) {
    return NextResponse.json({ active: false });
  }

  const qrAddon = addons.find((a) => a.addon === "QR_BOLIVIA");
  const qrImageUrl = qrAddon?.phoneNumberId ?? null;

  return NextResponse.json({
    active: true,
    hasUploadedQr: !!qrImageUrl,
    qrImageUrl,
  });
}
