import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]).default("EFECTIVO"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    variantId: z.string().optional(),
    variantSnapshot: z.record(z.string(), z.unknown()).optional(),
  })).min(1),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const VALID_STATUSES = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;
  type ValidStatus = typeof VALID_STATUSES[number];
  const validStatus = VALID_STATUSES.includes(status as ValidStatus) ? (status as ValidStatus) : undefined;

  const where = {
    organizationId: profile.organizationId,
    ...(validStatus ? { status: validStatus } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        customer: true,
        staff: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "orders:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const staffProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { customerName, customerId, paymentMethod, shippingAddress, notes, items } = result.data;
  const total = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);

  const order = await prisma.order.create({
    data: {
      organizationId: profile.organizationId,
      customerName: customerName.trim(),
      customerId: customerId ?? null,
      staffId: staffProfile?.id ?? null,
      paymentMethod,
      shippingAddress: shippingAddress ?? null,
      notes: notes ?? null,
      total,
      items: {
        create: items.map((i): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          variantId: i.variantId ?? null,
          variantSnapshot: i.variantSnapshot ?? Prisma.DbNull,
        })),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  await Promise.all(
    items.map((i) =>
      i.variantId
        ? prisma.productVariant.update({
            where: { id: i.variantId },
            data: { stock: { decrement: i.quantity } },
          })
        : prisma.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          })
    )
  );

  const org = await prisma.organization.findUnique({ where: { id: profile.organizationId }, select: { name: true } });
  const orgName = org?.name ?? "Tu Tienda";
  const orderItems = order.items.map(i => ({ name: i.product.name, quantity: i.quantity, unitPrice: Number(i.unitPrice) }));

  // Confirmation email to customer
  const customerEmail = order.customer?.email;
  if (customerEmail) {
    sendOrderConfirmation({
      to: customerEmail,
      customerName: order.customerName,
      orgName,
      orderId: order.id,
      items: orderItems,
      total: Number(order.total),
      paymentMethod,
    }).catch(() => {});
  }

  // New order alert to admin
  const adminProfiles = await prisma.profile.findMany({
    where: { organizationId: profile.organizationId, role: "ADMIN" },
    select: { userId: true },
  });
  if (adminProfiles.length > 0) {
    const supabaseAdmin = createAdminClient();
    const adminEmails = (await Promise.all(
      adminProfiles.map(p => supabaseAdmin.auth.admin.getUserById(p.userId).then(r => r.data.user?.email))
    )).filter(Boolean) as string[];
    for (const email of adminEmails) {
      sendNewOrderAlert({
        to: email,
        orgName,
        orderId: order.id,
        customerName: order.customerName,
        total: Number(order.total),
        items: orderItems,
        paymentMethod,
      }).catch(() => {});
    }
  }

  return NextResponse.json(order, { status: 201 });
}
