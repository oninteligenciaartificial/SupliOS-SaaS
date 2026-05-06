import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission } from "@/lib/permissions";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { reportAsyncError } from "@/lib/monitoring";

const createSchema = z.object({
  customerName: z.string().min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA"]).default("EFECTIVO"),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
  loyaltyPointsRedeemed: z.number().int().min(0).optional(),
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

  // Rate limit: 60 orders per minute per org
  const rateLimited = checkOrgRateLimit(profile.organizationId, "orders", { windowMs: 60_000, max: 60 });
  if (rateLimited) return rateLimited;

  const staffProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { customerName, customerId, paymentMethod, shippingAddress, notes, loyaltyPointsRedeemed, items } = result.data;
  const subtotalRaw = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);

  // 10 points = Bs. 1 discount
  const POINTS_TO_BOB = 0.1;
  let pointsDiscount = 0;
  if (loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0 && customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, organizationId: profile.organizationId }, select: { loyaltyPoints: true } });
    if (!customer) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    const maxRedeemable = customer.loyaltyPoints;
    const actualPoints = Math.min(loyaltyPointsRedeemed, maxRedeemable);
    pointsDiscount = Math.min(actualPoints * POINTS_TO_BOB, subtotalRaw);
  }
  const total = Math.max(0, subtotalRaw - pointsDiscount);

  const orderCreateOp = prisma.order.create({
    data: {
      organizationId: profile.organizationId,
      customerName: customerName.trim(),
      customerId: customerId ?? null,
      staffId: staffProfile?.id ?? null,
      paymentMethod,
      shippingAddress: shippingAddress ?? null,
      notes: loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0
        ? `${notes ? notes + " | " : ""}Puntos canjeados: ${loyaltyPointsRedeemed} (-Bs. ${pointsDiscount.toFixed(2)})`
        : (notes ?? null),
      total,
      items: {
        create: items.map((i): Prisma.OrderItemUncheckedCreateWithoutOrderInput => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          variantId: i.variantId ?? null,
          variantSnapshot: (i.variantSnapshot ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
        })),
      },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  const stockOps = items.map((i) =>
    i.variantId
      ? prisma.productVariant.update({ where: { id: i.variantId }, data: { stock: { decrement: i.quantity } } })
      : prisma.product.update({ where: { id: i.productId }, data: { stock: { decrement: i.quantity } } })
  );

  const loyaltyOps = loyaltyPointsRedeemed && loyaltyPointsRedeemed > 0 && customerId
    ? [prisma.customer.update({ where: { id: customerId }, data: { loyaltyPoints: { decrement: loyaltyPointsRedeemed } } })]
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResults = await (prisma.$transaction as (ops: any[]) => Promise<any[]>)([orderCreateOp, ...stockOps, ...loyaltyOps]);
  const order = txResults[0] as Awaited<typeof orderCreateOp>;

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: user.id, action: "create", entityType: "order", entityId: order.id, after: { total, items: items.length, paymentMethod } });

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
    }).catch((error) => {
      reportAsyncError("api.orders.sendOrderConfirmation", error, {
        orderId: order.id,
        organizationId: profile.organizationId,
      });
    });
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
      }).catch((error) => {
        reportAsyncError("api.orders.sendNewOrderAlert", error, {
          orderId: order.id,
          organizationId: profile.organizationId,
          email,
        });
      });
    }
  }

  return NextResponse.json(order, { status: 201 });
}
