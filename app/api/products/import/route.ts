import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Solo admins pueden importar" }, { status: 403 });

  if (!canUseFeature(profile.plan, "csv_import")) return NextResponse.json(planGateError("csv_import"), { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se subio ningun archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  function sanitizeRow(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(obj)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      const val = obj[key];
      sanitized[key] = (val && typeof val === "object" && !Array.isArray(val))
        ? Object.create(null)
        : val;
    }
    return sanitized;
  }

  const sanitizedRows = rows.map(sanitizeRow);

  if (rows.length === 0) return NextResponse.json({ error: "El archivo esta vacio" }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: "Maximo 500 productos por importacion" }, { status: 400 });

  const orgId = profile.organizationId;
  const created: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < sanitizedRows.length; i++) {
    const row = sanitizedRows[i];
    const name = String(row["nombre"] ?? row["name"] ?? row["Nombre"] ?? "").trim();
    if (!name) { errors.push(`Fila ${i + 2}: nombre requerido`); continue; }

    const price = Number(row["precio"] ?? row["price"] ?? row["Precio"] ?? 0);
    const cost = Number(row["costo"] ?? row["cost"] ?? row["Costo"] ?? 0);
    const stock = Number(row["stock"] ?? row["Stock"] ?? 0);
    const minStock = Number(row["stock_minimo"] ?? row["min_stock"] ?? row["Stock Minimo"] ?? 5);
    const sku = String(row["sku"] ?? row["SKU"] ?? "").trim() || null;
    const categoryName = String(row["categoria"] ?? row["category"] ?? row["Categoria"] ?? "").trim();

    let categoryId: string | null = null;
    if (categoryName) {
      const cat = await prisma.category.upsert({
        where: { organizationId_name: { organizationId: orgId, name: categoryName } },
        create: { organizationId: orgId, name: categoryName },
        update: {},
      });
      categoryId = cat.id;
    }

    try {
      await prisma.product.create({
        data: {
          organizationId: orgId,
          name,
          sku,
          price,
          cost,
          stock: Math.max(0, Math.floor(stock)),
          minStock: Math.max(0, Math.floor(minStock)),
          categoryId,
          active: true,
        },
      });
      created.push(name);
    } catch {
      errors.push(`Fila ${i + 2}: ${name} — SKU duplicado o error`);
    }
  }

  return NextResponse.json({ created: created.length, errors });
}
