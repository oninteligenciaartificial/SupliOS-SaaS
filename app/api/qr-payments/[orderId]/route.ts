import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, canUseAddon, planGateError } from "@/lib/plans";
import { generateQR, checkStatus, cancelPayment } from "@/lib/qr-bolivia";
import type { PlanType, AddonType } from "@/lib/plans";

// POST /api/qr-payments/[orderId] — genera QR para un pedido
export async function POST(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan as PlanType, "pagos_qr"))
    return NextResponse.json(planGateError("pagos_qr"), { status: 403 });

  const addons = await prisma.orgAddon.findMany({
    where: { organizationId: profile.organizationId, active: true },
    select: { addon: true },
  });
  const activeAddons = addons.map((a) => a.addon as AddonType);
  if (!canUseAddon(activeAddons, "QR_BOLIVIA"))
    return NextResponse.json({ error: "Addon QR Bolivia no activado" }, { status: 403 });

  const { orderId } = await params;

  // Verificar que no haya ya un QR activo para este pedido
  const existing = await prisma.qrPayment.findFirst({
    where: { orderId, organizationId: profile.organizationId, status: "PENDIENTE" },
    select: { id: true, expiresAt: true },
  });
  if (existing && existing.expiresAt > new Date())
    return NextResponse.json({ error: "Ya existe un QR activo para este pedido" }, { status: 409 });

  const result = await generateQR(profile.organizationId, orderId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return NextResponse.json({
    qrPaymentId: result.qrPaymentId,
    qrPayload:   result.qrPayload,
    qrImageUrl:  result.qrImageUrl,
    expiresAt:   result.expiresAt,
  }, { status: 201 });
}

// GET /api/qr-payments/[orderId] — estado del último QR
export async function GET(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await params;

  const qr = await prisma.qrPayment.findFirst({
    where: { orderId, organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, status: true, qrPayload: true, qrImageUrl: true,
      amount: true, expiresAt: true, paidAt: true, createdAt: true,
    },
  });
  if (!qr) return NextResponse.json({ error: "Sin QR" }, { status: 404 });

  // Si está pendiente, refresca desde PSP
  if (qr.status === "PENDIENTE") {
    const refreshed = await checkStatus(qr.id, profile.organizationId);
    if (refreshed.ok) return NextResponse.json({ ...qr, status: refreshed.status });
  }

  return NextResponse.json(qr);
}

// DELETE /api/qr-payments/[orderId] — cancela el QR activo
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await params;

  const qr = await prisma.qrPayment.findFirst({
    where: { orderId, organizationId: profile.organizationId, status: "PENDIENTE" },
    select: { id: true },
  });
  if (!qr) return NextResponse.json({ error: "Sin QR activo para cancelar" }, { status: 404 });

  const result = await cancelPayment(qr.id, profile.organizationId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return NextResponse.json({ ok: true });
}
