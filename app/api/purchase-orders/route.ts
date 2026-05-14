import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive(),
  })).min(1),
});

const updateSchema = z.object({
  status: z.enum(["BORRADOR", "ENVIADO", "PARCIAL", "RECIBIDO", "CANCELADO"]).optional(),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "suppliers:view")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const supplierId = searchParams.get("supplierId");

  const where: Record<string, unknown> = { organizationId: profile.organizationId };
  if (status) where.status = status as any;
  if (supplierId) where.supplierId = supplierId;

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: orders,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "suppliers:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos", details: parsed.error.issues }, { status: 400 });

  const { supplierId, expectedDate, notes, items } = parsed.data;

  // Verify supplier belongs to org
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId: profile.organizationId },
  });
  if (!supplier) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      organizationId: profile.organizationId,
      supplierId,
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
      notes,
      total,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  await logAudit({
    orgId: profile.organizationId,
    orgPlan: profile.plan,
    userId: profile.userId,
    action: "CREATE",
    entityType: "PurchaseOrder",
    entityId: po.id,
    after: { supplierId, total, itemCount: items.length },
  }).catch(() => {});

  return NextResponse.json({ data: po }, { status: 201 });
}

export async function PATCH(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "suppliers:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: profile.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: parsed.data,
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  // If status changed to RECIBIDO, update product stock
  if (parsed.data.status === "RECIBIDO" && existing.status !== "RECIBIDO") {
    const items = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    // Stock updated via transaction above
    // Low stock alerts are handled by the cron job (/api/cron/low-stock)
  }

  await logAudit({
    orgId: profile.organizationId,
    orgPlan: profile.plan,
    userId: profile.userId,
    action: "UPDATE",
    entityType: "PurchaseOrder",
    entityId: id,
    before: { status: existing.status },
    after: { status: updated.status },
  }).catch(() => {});

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "suppliers:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, organizationId: profile.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  if (existing.status === "RECIBIDO") {
    return NextResponse.json({ error: "No se puede eliminar una orden recibida" }, { status: 400 });
  }

  await prisma.purchaseOrder.delete({ where: { id } });

  await logAudit({
    orgId: profile.organizationId,
    orgPlan: profile.plan,
    userId: profile.userId,
    action: "DELETE",
    entityType: "PurchaseOrder",
    entityId: id,
    before: { status: existing.status },
  }).catch(() => {});

  return NextResponse.json({ data: { id } });
}
