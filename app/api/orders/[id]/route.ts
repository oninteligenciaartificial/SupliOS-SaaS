import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusUpdate, sendLoyaltyPointsEmail } from "@/lib/email";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"]),
  notes: z.string().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, customer: true },
  });

  if (!order || order.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getTenantProfile();
  if (!profile || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "orders:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!order || order.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const updated = await prisma.order.update({ where: { id }, data: result.data });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: user.id, action: "update", entityType: "order", entityId: id, before: { status: order.status }, after: { status: result.data.status } });

  // Restore stock when cancelling
  if (result.data.status === "CANCELADO" && order.status !== "CANCELADO") {
    await Promise.all(
      order.items.map((item) =>
        item.variantId
          ? prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            })
          : prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
      )
    );
  }

  // Re-decrement stock if un-cancelling
  if (result.data.status !== "CANCELADO" && order.status === "CANCELADO") {
    await Promise.all(
      order.items.map((item) =>
        item.variantId
          ? prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            })
          : prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
      )
    );
  }

  const customerEmail = order.customer?.email;
  const statusChanged = result.data.status !== order.status;

  if (statusChanged) {
    const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
    const orgName = org?.name ?? "Tu Tienda";

    if (customerEmail) {
      sendOrderStatusUpdate({
        to: customerEmail,
        customerName: order.customerName,
        orgName,
        orderId: order.id,
        status: result.data.status,
      }).catch(() => {});
    }

    // Loyalty points on delivery — always accumulate, email only if customer has one
    if (result.data.status === "ENTREGADO" && order.customerId) {
      const POINTS_PER_BOB = 0.1; // 1 punto por cada Bs. 10
      const pointsEarned = Math.floor(Number(order.total) * POINTS_PER_BOB);
      const updatedCustomer = await prisma.customer.update({
        where: { id: order.customerId },
        data: { loyaltyPoints: { increment: pointsEarned } },
        select: { loyaltyPoints: true },
      });
      if (customerEmail) {
        sendLoyaltyPointsEmail({
          to: customerEmail,
          customerName: order.customerName,
          orgName,
          pointsEarned,
          totalPoints: updatedCustomer.loyaltyPoints,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json(updated);
}
