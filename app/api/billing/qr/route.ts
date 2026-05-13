import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { generateQR, checkStatus } from "@/lib/qr-bolivia";

const MONTH_DISCOUNT: Record<number, number> = { 1: 0, 3: 5, 6: 10, 12: 15 };

// POST /api/billing/qr — genera QR para pago de plan
export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const schema = { plan: "", months: 1 };
  const parsed = body as typeof schema;
  if (!["BASICO", "CRECER", "PRO", "EMPRESARIAL"].includes(parsed.plan))
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  if (![1, 3, 6, 12].includes(parsed.months))
    return NextResponse.json({ error: "Meses inválidos" }, { status: 400 });

  const plan = parsed.plan as PlanType;
  const months = parsed.months;
  const pricePerMonth = PLAN_PRICES_BOB[plan];
  const discount = MONTH_DISCOUNT[months] ?? 0;
  const amountBOB = Math.round(pricePerMonth * months * (1 - discount / 100));

  // Check for pending payment request
  const pending = await prisma.paymentRequest.findFirst({
    where: { organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (pending) {
    return NextResponse.json({ error: "Ya tienes una solicitud de pago pendiente." }, { status: 409 });
  }

  // Create payment request
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      organizationId: profile.organizationId,
      plan,
      months,
      amountBOB,
      reference: `QR_${plan}_${months}_${profile.organizationId}`,
    },
  });

  // Create a pseudo-order for QR generation
  const orderId = `plan_${plan}_${months}_${profile.organizationId}`;

  // Generate QR using the existing QR Bolivia system
  const qrResult = await generateQR(profile.organizationId, orderId);
  if (!qrResult.ok) {
    // If QR generation fails, still return payment request info
    return NextResponse.json({
      paymentRequestId: paymentRequest.id,
      amountBOB,
      plan,
      months,
      discount,
      qrAvailable: false,
      qrError: qrResult.error,
    });
  }

  return NextResponse.json({
    paymentRequestId: paymentRequest.id,
    amountBOB,
    plan,
    months,
    discount,
    qrAvailable: true,
    qrPaymentId: qrResult.qrPaymentId,
    qrPayload: qrResult.qrPayload,
    qrImageUrl: qrResult.qrImageUrl,
    expiresAt: qrResult.expiresAt,
  }, { status: 201 });
}

// GET /api/billing/qr — estado del QR de pago de plan
export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qrPaymentId = searchParams.get("qrPaymentId");
  if (!qrPaymentId) return NextResponse.json({ error: "qrPaymentId requerido" }, { status: 400 });

  const result = await checkStatus(qrPaymentId, profile.organizationId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 });

  // If paid, check if plan was activated
  const qr = await prisma.qrPayment.findUnique({
    where: { id: qrPaymentId },
    select: { status: true, paidAt: true, amount: true },
  });

  return NextResponse.json({
    status: result.status,
    paidAt: qr?.paidAt,
    amount: qr?.amount,
  });
}
