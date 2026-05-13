import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import * as XLSX from "xlsx";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Solo admins pueden importar" }, { status: 403 });

  if (!canUseFeature(profile.plan, "csv_import")) return NextResponse.json(planGateError("csv_import"), { status: 403 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "products-import", RATE_LIMITS.import);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se subio ningun archivo" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Archivo demasiado grande (máx 5 MB)" }, { status: 413 });

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido (xlsx, xls, csv)" }, { status: 400 });
  }

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

  if (sanitizedRows.length === 0) return NextResponse.json({ error: "El archivo esta vacio" }, { status: 400 });
  if (sanitizedRows.length > 500) return NextResponse.json({ error: "Maximo 500 productos por importacion" }, { status: 400 });

  const orgId = profile.organizationId;
  const created: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < sanitizedRows.length; i++) {
    const row = sanitizedRows[i];
    const name = String(row["nombre"] ?? row["name"] ?? row["Nombre"] ?? "").trim().slice(0, 255);
    if (!name) { errors.push(`Fila ${i + 2}: nombre requerido`); continue; }

    const price = Math.max(0, Math.min(999999, Number(row["precio"] ?? row["price"] ?? row["Precio"] ?? 0)));
    const cost = Math.max(0, Math.min(999999, Number(row["costo"] ?? row["cost"] ?? row["Costo"] ?? 0)));
    const stock = Math.max(0, Math.min(999999, Number(row["stock"] ?? row["Stock"] ?? 0)));
    const minStock = Math.max(0, Math.min(9999, Number(row["stock_minimo"] ?? row["min_stock"] ?? row["Stock Minimo"] ?? 5)));
    const sku = String(row["sku"] ?? row["SKU"] ?? "").trim().slice(0, 100) || null;
    const categoryName = String(row["categoria"] ?? row["category"] ?? row["Categoria"] ?? "").trim().slice(0, 100);

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
