import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  const branchId = searchParams.get("branchId") ?? undefined;

  const orgId = profile.organizationId;
  const orderWhere = {
    organizationId: orgId,
    createdAt: { gte: from, lte: toEnd },
    status: { not: "CANCELADO" as const },
    ...(branchId ? { branchId } : {}),
  };

  const [org, orders, topProductItems, stockAlerts, totalCustomers, staffSales, noMovementProducts, topCustomerRaw, branches] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { currency: true } }),
    prisma.order.findMany({
      where: orderWhere,
      select: { total: true, createdAt: true, paymentMethod: true },
    }),
    prisma.orderItem.findMany({
      where: { order: orderWhere },
      include: { product: { select: { name: true, cost: true, category: { select: { name: true } } } } },
    }),
    prisma.product.findMany({
      where: { organizationId: orgId, active: true },
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    prisma.customer.count({ where: { organizationId: orgId } }),
    prisma.order.groupBy({
      by: ["staffId"],
      where: { ...orderWhere, staffId: { not: null } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.product.findMany({
      where: {
        organizationId: orgId,
        active: true,
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        orderItems: { none: { order: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
      },
      select: { id: true, name: true, stock: true, updatedAt: true },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { ...orderWhere, customerId: { not: null } },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.branch.findMany({ where: { organizationId: orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const currency = org?.currency ?? "MXN";

  // Staff names
  const staffIds = staffSales.map(s => s.staffId).filter(Boolean) as string[];
  const staffProfiles = staffIds.length > 0
    ? await prisma.profile.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } })
    : [];
  const staffMap = Object.fromEntries(staffProfiles.map(p => [p.id, p.name]));

  // Top customer names
  const customerIds = topCustomerRaw.map(c => c.customerId!).filter(Boolean);
  const customerRecords = customerIds.length > 0
    ? await prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
    : [];
  const customerMap = Object.fromEntries(customerRecords.map(c => [c.id, c.name]));

  const totalRevenue = orders.reduce((sum: number, o: { total: unknown }) => sum + Number(o.total), 0);
  const totalOrders = orders.length;

  // Top selling products with margin + sales by category
  const productSales: Record<string, { name: string; quantity: number; revenue: number; margin: number }> = {};
  const categorySales: Record<string, { name: string; revenue: number; quantity: number }> = {};

  for (const item of topProductItems) {
    const key = item.productId;
    if (!productSales[key]) productSales[key] = { name: item.product.name, quantity: 0, revenue: 0, margin: 0 };
    productSales[key].quantity += item.quantity;
    productSales[key].revenue += item.quantity * Number(item.unitPrice);
    productSales[key].margin += item.quantity * (Number(item.unitPrice) - Number(item.product.cost));

    const catName = item.product.category?.name ?? "Sin categoría";
    if (!categorySales[catName]) categorySales[catName] = { name: catName, revenue: 0, quantity: 0 };
    categorySales[catName].revenue += item.quantity * Number(item.unitPrice);
    categorySales[catName].quantity += item.quantity;
  }

  const topSelling = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const salesByCategory = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

  const lowStock = stockAlerts.filter((p: { id: string; name: string; stock: number; minStock: number }) => p.stock <= p.minStock);

  // Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  for (const o of orders) {
    const method = o.paymentMethod ?? "EFECTIVO";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + Number(o.total);
  }

  // Sales by staff
  const salesByStaff = staffSales.map(s => ({
    staffId: s.staffId,
    staffName: staffMap[s.staffId ?? ""] ?? "Sin asignar",
    total: Number(s._sum.total ?? 0),
    orders: s._count.id,
  }));

  // Top customers
  const topCustomers = topCustomerRaw.map(c => ({
    customerId: c.customerId,
    customerName: customerMap[c.customerId!] ?? "Cliente",
    total: Number(c._sum.total ?? 0),
    orders: c._count.id,
  }));

  const totalMargin = Object.values(productSales).reduce((sum, p) => sum + p.margin, 0);

  return NextResponse.json({
    currency,
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalMargin,
    topSelling,
    salesByCategory,
    topCustomers,
    lowStock,
    paymentBreakdown,
    salesByStaff,
    noMovement: noMovementProducts,
    branches,
  });
}
