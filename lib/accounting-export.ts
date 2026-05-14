import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseAddon, canUseFeature } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function escapeCsv(val: string | number | null): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "accounting-export", RATE_LIMITS.export);
  if (rateLimited) return rateLimited;

  const activeAddons = await prisma.orgAddon.findMany({
    where: { organizationId: profile.organizationId, active: true },
    select: { addon: true },
  });
  const addonList = activeAddons.map((a) => a.addon);

  const hasAddon = canUseAddon(addonList, "CONTABILIDAD");
  const hasFeature = canUseFeature(profile.plan, "csv_export");

  if (!hasAddon && !hasFeature) {
    return NextResponse.json(
      { error: "Requiere add-on Exportación Contable o plan CRECER+" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const type = searchParams.get("type") || "ventas";

  const from = fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toParam ? new Date(toParam) : new Date();

  const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxRangeMs) {
    return NextResponse.json({ error: "El rango máximo de exportación es 1 año" }, { status: 400 });
  }
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Fechas invalidas" }, { status: 400 });
  }

  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);

  if (type === "ventas") {
    return exportVentas(profile.organizationId, from, toEnd);
  } else if (type === "resumen") {
    return exportResumen(profile.organizationId, from, toEnd);
  } else if (type === "clientes") {
    return exportClientes(profile.organizationId, from, toEnd);
  } else if (type === "inventario") {
    return exportInventario(profile.organizationId);
  }

  return NextResponse.json({ error: "Tipo de export invalido" }, { status: 400 });
}

async function exportVentas(orgId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: from, lte: to },
      status: { not: "CANCELADO" },
    },
    include: {
      items: {
        include: {
          product: { select: { name: true, cost: true, category: { select: { name: true } } } },
        },
      },
      customer: { select: { name: true, rfc: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [
    "Fecha,Folio,Cliente,NIT,Categoria,Producto,Cantidad,Precio Unit.,Costo Unit.,Subtotal,Costo Total,Margen,Margen %,Metodo Pago,Estado",
  ];

  for (const order of orders) {
    const date = order.createdAt.toISOString().split("T")[0];
    const folio = order.id.slice(-8).toUpperCase();
    const cliente = escapeCsv(order.customer?.name ?? order.customerName);
    const nit = escapeCsv(order.customer?.rfc ?? "");
    const metodo = escapeCsv(order.paymentMethod);
    const estado = escapeCsv(order.status);

    for (const item of order.items) {
      const categoria = escapeCsv(item.product.category?.name ?? "Sin categoría");
      const producto = escapeCsv(item.product.name);
      const qty = item.quantity;
      const precio = Number(item.unitPrice).toFixed(2);
      const costo = Number(item.product.cost ?? 0).toFixed(2);
      const subtotal = (qty * Number(item.unitPrice)).toFixed(2);
      const costoTotal = (qty * Number(item.product.cost ?? 0)).toFixed(2);
      const margen = (Number(subtotal) - Number(costoTotal)).toFixed(2);
      const margenPct = Number(subtotal) > 0 ? ((Number(margen) / Number(subtotal)) * 100).toFixed(1) : "0.0";

      rows.push(
        [date, folio, cliente, nit, categoria, producto, qty, precio, costo, subtotal, costoTotal, margen, margenPct, metodo, estado].join(",")
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

async function exportResumen(orgId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: from, lte: to },
      status: { not: "CANCELADO" },
    },
    select: {
      total: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
      items: { select: { quantity: true, unitPrice: true, product: { select: { cost: true } } } },
    },
  });

  const totalVentas = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalCostos = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce((s, i) => s + i.quantity * Number(i.product.cost ?? 0), 0),
    0
  );
  const totalMargen = totalVentas - totalCostos;
  const margenPct = totalVentas > 0 ? ((totalMargen / totalVentas) * 100).toFixed(1) : "0.0";

  const porMetodo: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porEstado: Record<string, number> = {};

  for (const o of orders) {
    porMetodo[o.paymentMethod] = (porMetodo[o.paymentMethod] || 0) + Number(o.total);
    const mes = o.createdAt.toISOString().slice(0, 7);
    porMes[mes] = (porMes[mes] || 0) + Number(o.total);
    porEstado[o.status] = (porEstado[o.status] || 0) + 1;
  }

  const rows: string[] = [
    "RESUMEN CONTABLE",
    `Periodo,${from.toISOString().split("T")[0]} a ${to.toISOString().split("T")[0]}`,
    `Total de ventas,Bs. ${totalVentas.toFixed(2)}`,
    `Total costos,Bs. ${totalCostos.toFixed(2)}`,
    `Margen bruto,Bs. ${totalMargen.toFixed(2)}`,
    `Margen %,${margenPct}%`,
    `Total de pedidos,${orders.length}`,
    "",
    "POR METODO DE PAGO",
    "Metodo,Total",
    ...Object.entries(porMetodo).map(([k, v]) => `${k},Bs. ${v.toFixed(2)}`),
    "",
    "POR MES",
    "Mes,Total",
    ...Object.entries(porMes).map(([k, v]) => `${k},Bs. ${v.toFixed(2)}`),
    "",
    "POR ESTADO",
    "Estado,Cantidad",
    ...Object.entries(porEstado).map(([k, v]) => `${k},${v}`),
  ];

  const csv = rows.join("\n");
  const filename = `gestios-resumen-${from.toISOString().split("T")[0]}-${to.toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportClientes(orgId: string, from: Date, to: Date) {
  const customers = await prisma.customer.findMany({
    where: { organizationId: orgId },
    include: {
      orders: {
        where: { createdAt: { gte: from, lte: to } },
        select: { total: true, createdAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows: string[] = [
    "Nombre,Telefono,Email,NIT,Direccion,Puntos Lealtad,Total Compras (periodo),Cantidad Compras,Ultima Compra",
  ];

  for (const c of customers) {
    const totalCompras = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
    const ultimaCompra = c.orders.length > 0
      ? c.orders.reduce((latest, o) => (o.createdAt > latest ? o.createdAt : latest), new Date(0)).toISOString().split("T")[0]
      : "";

    rows.push(
      [
        escapeCsv(c.name),
        escapeCsv(c.phone ?? ""),
        escapeCsv(c.email ?? ""),
        escapeCsv(c.rfc ?? ""),
        escapeCsv(c.address ?? ""),
        c.loyaltyPoints,
        `Bs. ${totalCompras.toFixed(2)}`,
        c.orders.length,
        ultimaCompra,
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  const filename = `gestios-clientes-${from.toISOString().split("T")[0]}-${to.toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportInventario(orgId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId: orgId, active: true },
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true } },
      variants: true,
    },
    orderBy: { name: "asc" },
  });

  const rows: string[] = [
    "SKU,Nombre,Categoria,Proveedor,Precio,Costo,Stock,Stock Minimo,Unidad,Variantes,Activo",
  ];

  for (const p of products) {
    if (p.hasVariants && p.variants.length > 0) {
      for (const v of p.variants) {
        rows.push(
          [
            escapeCsv(p.sku ?? ""),
            escapeCsv(`${p.name} (${v.attributes})`),
            escapeCsv(p.category?.name ?? ""),
            escapeCsv(p.supplier?.name ?? ""),
            Number(v.price ?? p.price).toFixed(2),
            Number(p.cost ?? 0).toFixed(2),
            v.stock,
            p.minStock,
            escapeCsv(p.unit ?? ""),
            "Si",
            p.active ? "Si" : "No",
          ].join(",")
        );
      }
    } else {
      rows.push(
        [
          escapeCsv(p.sku ?? ""),
          escapeCsv(p.name),
          escapeCsv(p.category?.name ?? ""),
          escapeCsv(p.supplier?.name ?? ""),
          Number(p.price).toFixed(2),
          Number(p.cost ?? 0).toFixed(2),
          p.stock,
          p.minStock,
          escapeCsv(p.unit ?? ""),
          "No",
          p.active ? "Si" : "No",
        ].join(",")
      );
    }
  }

  const csv = rows.join("\n");
  const filename = `gestios-inventario-${new Date().toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
