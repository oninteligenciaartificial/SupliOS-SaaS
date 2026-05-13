import { prisma } from "@/lib/prisma";
import { reportAsyncError } from "@/lib/monitoring";
import { getProvider } from "@/lib/qr-providers";
import type { WebhookEvent } from "@/lib/qr-providers/types";

const DEFAULT_EXPIRY_MINUTES = Number(process.env.QR_BOLIVIA_DEFAULT_EXPIRY_MINUTES ?? "15");

function webhookBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

// Generates a QR for an Order. Returns qrPayload + QrPayment id.
export async function generateQR(
  organizationId: string,
  orderId: string,
): Promise<{ ok: true; qrPaymentId: string; qrPayload: string; qrImageUrl?: string; expiresAt: Date } | { ok: false; error: string }> {
  const [org, order] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    }),
    prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, organizationId: true, total: true },
    }),
  ]);

  if (!org || !order || order.organizationId !== organizationId)
    return { ok: false, error: "Pedido no encontrado" };

  const addon = await prisma.orgAddon.findUnique({
    where: { organizationId_addon: { organizationId, addon: "QR_BOLIVIA" } },
    select: { active: true },
  });
  if (!addon?.active) return { ok: false, error: "Addon QR_BOLIVIA no activo" };

  const config: Record<string, string> = {};
  const provider = getProvider(config.provider);

  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000);

  const result = await provider.createQr({
    merchantId:    config.merchantId ?? "",
    accountAlias:  config.accountAlias,
    amount:        Number(order.total),
    currency:      "BOB",
    orderId,
    expiryMinutes: DEFAULT_EXPIRY_MINUTES,
    callbackUrl:   `${webhookBaseUrl()}/api/qr-payments/webhook`,
  });

  if (!result.ok) return result;

  const qrPayment = await prisma.qrPayment.create({
    data: {
      organizationId,
      orderId,
      provider:    config.provider ?? "AGGREGATOR",
      externalId:  result.externalId,
      qrPayload:   result.qrPayload,
      qrImageUrl:  result.qrImageUrl,
      amount:      order.total,
      currency:    "BOB",
      expiresAt,
    },
    select: { id: true, qrPayload: true, qrImageUrl: true, expiresAt: true },
  });

  return {
    ok: true,
    qrPaymentId: qrPayment.id,
    qrPayload:   qrPayment.qrPayload,
    qrImageUrl:  qrPayment.qrImageUrl ?? undefined,
    expiresAt:   qrPayment.expiresAt,
  };
}

// Polls PSP for latest status and updates DB.
export async function checkStatus(
  qrPaymentId: string,
  organizationId: string,
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const qr = await prisma.qrPayment.findUnique({
    where: { id: qrPaymentId },
    select: { id: true, organizationId: true, externalId: true, provider: true, status: true, orderId: true },
  });
  if (!qr || qr.organizationId !== organizationId) return { ok: false, error: "QR no encontrado" };
  if (qr.status !== "PENDIENTE") return { ok: true, status: qr.status };

  const provider = getProvider(qr.provider);
  const result = await provider.getStatus(qr.externalId);
  if (!result.ok) return result;

  if (result.status !== "PENDIENTE") {
    await applyStatusChange(qr.id, qr.orderId, result.status, result.paidAt, result.payerInfo, result.raw);
  }

  return { ok: true, status: result.status };
}

// Cancels an active QR. Cannot cancel already-paid QRs.
export async function cancelPayment(
  qrPaymentId: string,
  organizationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const qr = await prisma.qrPayment.findUnique({
    where: { id: qrPaymentId },
    select: { id: true, organizationId: true, externalId: true, provider: true, status: true },
  });
  if (!qr || qr.organizationId !== organizationId) return { ok: false, error: "QR no encontrado" };
  if (qr.status === "PAGADO") return { ok: false, error: "No se puede cancelar un QR pagado" };
  if (qr.status !== "PENDIENTE") return { ok: true }; // already terminal

  const provider = getProvider(qr.provider);
  const result = await provider.cancel(qr.externalId);
  if (!result.ok) return result;

  await prisma.qrPayment.update({
    where: { id: qr.id },
    data: { status: "CANCELADO" },
  });
  return { ok: true };
}

// Processes a validated webhook event. Idempotent via updateMany filter.
export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  const qr = await prisma.qrPayment.findFirst({
    where: { provider: "AGGREGATOR", externalId: event.externalId },
    select: { id: true, orderId: true, status: true },
  });
  if (!qr) {
    reportAsyncError("qrBolivia.handleWebhookEvent.notFound", new Error("QR not found"), { externalId: event.externalId });
    return;
  }
  if (qr.status !== "PENDIENTE") return; // already processed

  await applyStatusChange(qr.id, qr.orderId, event.status, event.paidAt, event.payerInfo, event.raw);
}

// Marks expired QRs. Called by cron.
export async function expireStaleQrs(): Promise<{ expired: number }> {
  const result = await prisma.qrPayment.updateMany({
    where: { status: "PENDIENTE", expiresAt: { lt: new Date() } },
    data:  { status: "EXPIRADO" },
  });
  return { expired: result.count };
}

// Internal: apply a terminal status update atomically.
async function applyStatusChange(
  qrPaymentId: string,
  orderId: string,
  status: "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO",
  paidAt?: string,
  payerInfo?: Record<string, unknown>,
  raw?: unknown,
): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.qrPayment.updateMany({
      where: { id: qrPaymentId, status: "PENDIENTE" },
      data: {
        status,
        paidAt:           status === "PAGADO" ? (paidAt ? new Date(paidAt) : now) : undefined,
        payerInfo:        payerInfo as never,
        providerResponse: raw as never,
        webhookReceivedAt: now,
      },
    }),
    // Mark order ENTREGADO only on payment confirmed
    ...(status === "PAGADO"
      ? [prisma.order.updateMany({
          where: { id: orderId, status: { not: "CANCELADO" } },
          data:  { status: "ENTREGADO", paymentMethod: "TRANSFERENCIA" },
        })]
      : []),
  ]);

  // If this QR is for a plan payment (orderId starts with "plan_"), activate the plan
  if (status === "PAGADO") {
    await tryActivatePlanFromQr(orderId);
  }
}

// Activates a plan when a QR payment for a plan is confirmed.
async function tryActivatePlanFromQr(orderId: string): Promise<void> {
  if (!orderId.startsWith("plan_")) return;

  const parts = orderId.replace("plan_", "").split("_");
  if (parts.length < 3) return;

  const plan = parts[0] as "BASICO" | "CRECER" | "PRO" | "EMPRESARIAL";
  const months = parseInt(parts[1], 10);
  const orgId = parts.slice(2).join("_");

  if (isNaN(months) || months < 1 || months > 12) return;

  const planExpiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      planExpiresAt,
      trialEndsAt: null,
    },
  });
}
