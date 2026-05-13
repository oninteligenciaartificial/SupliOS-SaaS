import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "csv_export")) {
    return NextResponse.json(planGateError("csv_export"), { status: 403 });
  }

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "products-export", RATE_LIMITS.export);
  if (rateLimited) return rateLimited;

  const products = await prisma.product.findMany({
    where: { organizationId: profile.organizationId, active: true },
    include: { category: { select: { name: true } }, supplier: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const header = "Nombre,SKU,Categoria,Proveedor,Precio,Costo,Stock,Stock Minimo,Unidad,Codigo de Barras";
  const rows = products.map((p) => {
    const fields = [
      p.name,
      p.sku ?? "",
      p.category?.name ?? "",
      p.supplier?.name ?? "",
      Number(p.price).toFixed(2),
      Number(p.cost).toFixed(2),
      String(p.stock),
      String(p.minStock),
      p.unit ?? "",
      p.barcode ?? "",
    ];
    return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [header, ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="productos-${Date.now()}.csv"`,
    },
  });
}
