import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICES_BOB, type PlanType } from "@/lib/plans";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  plan: z.enum(["BASICO", "CRECER", "PRO", "EMPRESARIAL"]),
  months: z.number().int().min(1).max(12).default(1),
  reference: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const requests = await prisma.paymentRequest.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Rate limit: 5 payment requests per minute per org
  const rateLimited = checkOrgRateLimit(profile.organizationId, "payments", { windowMs: 60_000, max: 5 });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { plan, months, reference, notes } = result.data;
  const pricePerMonth = PLAN_PRICES_BOB[plan as PlanType];
  const amountBOB = pricePerMonth * months;

  const pending = await prisma.paymentRequest.findFirst({
    where: { organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (pending) {
    return NextResponse.json({ error: "Ya tienes una solicitud de pago pendiente." }, { status: 409 });
  }

  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      organizationId: profile.organizationId,
      plan: plan as PlanType,
      months,
      amountBOB,
      reference: reference?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(paymentRequest, { status: 201 });
}

export async function DELETE(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const existing = await prisma.paymentRequest.findFirst({
    where: { id, organizationId: profile.organizationId, status: "PENDIENTE" },
  });
  if (!existing) return NextResponse.json({ error: "Solicitud no encontrada o ya procesada" }, { status: 404 });

  await prisma.paymentRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
