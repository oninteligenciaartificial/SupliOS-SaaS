import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { generateInvoice, voidInvoice } from "@/lib/siat";
import { z } from "zod";
import type { PlanType } from "@/lib/plans";

const generateSchema = z.object({
  nitReceptor: z.string().optional(),
  razonReceptor: z.string().min(1),
});

// POST /api/invoices/[orderId] — genera factura SIAT para un pedido
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan as PlanType, "facturacion_siat"))
    return NextResponse.json(planGateError("facturacion_siat"), { status: 403 });

  const { orderId } = await params;

  // Verificar que el pedido pertenece a la org
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { organizationId: true, invoice: { select: { id: true } } },
  });
  if (!order || order.organizationId !== profile.organizationId)
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (order.invoice)
    return NextResponse.json({ error: "Ya existe una factura para este pedido" }, { status: 409 });

  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const result = generateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { nitReceptor, razonReceptor } = result.data;

  const invoice = await generateInvoice(
    profile.organizationId,
    orderId,
    { nit: nitReceptor, razonSocial: razonReceptor },
  );

  if (!invoice.ok) return NextResponse.json({ error: invoice.error }, { status: 422 });

  return NextResponse.json({ invoiceId: invoice.invoiceId, cufe: invoice.cufe }, { status: 201 });
}

// DELETE /api/invoices/[orderId] — anula la factura del pedido
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan as PlanType, "facturacion_siat"))
    return NextResponse.json(planGateError("facturacion_siat"), { status: 403 });

  const { orderId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    select: { id: true, organizationId: true },
  });

  if (!invoice || invoice.organizationId !== profile.organizationId)
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

  const result = await voidInvoice(invoice.id, profile.organizationId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  return NextResponse.json({ ok: true });
}

// GET /api/invoices/[orderId] — consulta factura del pedido
export async function GET(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { orderId },
    select: {
      id: true, nroFactura: true, cufe: true, status: true,
      nitReceptor: true, razonReceptor: true, total: true, createdAt: true,
    },
  });

  if (!invoice) return NextResponse.json({ error: "Sin factura" }, { status: 404 });
  return NextResponse.json(invoice);
}
