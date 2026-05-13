import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseAddon } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "reports-export", RATE_LIMITS.export);
  if (rateLimited) return rateLimited;

  const activeAddons = await prisma.orgAddon.findMany({
    where: { organizationId: profile.organizationId, active: true },
    select: { addon: true },
  });
  const addonList = activeAddons.map((a) => a.addon);

  if (!canUseAddon(addonList, "CONTABILIDAD")) {
    return NextResponse.json({ error: "Requiere add-on Exportación Contable" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toParam ? new Date(toParam) : new Date();

  // Validate date range: max 1 year export
  const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxRangeMs) {
    return NextResponse.json({ error: "El rango máximo de exportación es 1 año" }, { status: 400 });
  }
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Fechas invalidas" }, { status: 400 });
  }

  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      organizationId: profile.organizationId,
      createdAt: { gte: from, lte: toEnd },
      status: { not: "CANCELADO" },
    },
    include: {
      items: { include: { product: { select: { name: true, cost: true, category: { select: { name: true } } } } } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [
    "Fecha,Folio,Cliente,Categoria,Producto,Cantidad,Precio Unit.,Costo Unit.,Subtotal,Costo Total,Margen,Metodo Pago,Estado",
  ];

  for (const order of orders) {
    const date = order.createdAt.toISOString().split("T")[0];
    const folio = order.id.slice(-8).toUpperCase();
    const cliente = (order.customer?.name ?? order.customerName).replace(/,/g, " ");
    const metodo = order.paymentMethod;
    const estado = order.status;

    for (const item of order.items) {
      const categoria = (item.product.category?.name ?? "Sin categoría").replace(/,/g, " ");
      const producto = item.product.name.replace(/,/g, " ");
      const qty = item.quantity;
      const precio = Number(item.unitPrice).toFixed(2);
      const costo = Number(item.product.cost ?? 0).toFixed(2);
      const subtotal = (qty * Number(item.unitPrice)).toFixed(2);
      const costoTotal = (qty * Number(item.product.cost ?? 0)).toFixed(2);
      const margen = (Number(subtotal) - Number(costoTotal)).toFixed(2);

      rows.push(
        `${date},${folio},${cliente},${categoria},${producto},${qty},${precio},${costo},${subtotal},${costoTotal},${margen},${metodo},${estado}`
      );
    }
  }

  const csv = rows.join("\n");
  const filename = `gestios-ventas-${from.toISOString().split("T")[0]}-${to.toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
