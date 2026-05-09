import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, PLAN_LIMITS, limitGateError } from "@/lib/plans";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 500 * 1024;

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!canUseFeature(profile.plan, "csv_import")) {
    return NextResponse.json(
      { error: "La importación CSV requiere el plan Crecer o superior.", upgrade: true, requiredPlan: "CRECER" },
      { status: 403 }
    );
  }

  const rateLimited = checkOrgRateLimit(profile.organizationId, "customers-import", RATE_LIMITS.import);
  if (rateLimited) return rateLimited;

  let text: string;
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 500 KB)" }, { status: 413 });
    }
    text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 500 KB)" }, { status: 413 });
    }
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 400 });
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "El archivo está vacío o no tiene datos" }, { status: 400 });
  }
  if (lines.length > 1001) {
    return NextResponse.json({ error: "Maximo 1000 clientes por importación" }, { status: 400 });
  }

  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const idx = {
    name: header.indexOf("name") !== -1 ? header.indexOf("name") : header.indexOf("nombre"),
    phone: header.indexOf("phone") !== -1 ? header.indexOf("phone") : header.indexOf("telefono"),
    email: header.indexOf("email") !== -1 ? header.indexOf("email") : header.indexOf("correo"),
    address: header.indexOf("address") !== -1 ? header.indexOf("address") : header.indexOf("direccion"),
    notes: header.indexOf("notes") !== -1 ? header.indexOf("notes") : header.indexOf("notas"),
  };

  if (idx.name === -1) {
    return NextResponse.json({ error: "El CSV debe tener una columna 'name' o 'nombre'" }, { status: 400 });
  }

  const maxCustomers = PLAN_LIMITS[profile.plan].maxCustomers;
  const currentCount = await prisma.customer.count({ where: { organizationId: profile.organizationId } });

  const rows = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    return {
      name: (cols[idx.name] ?? "").slice(0, 255),
      phone: idx.phone !== -1 ? (cols[idx.phone] || "").slice(0, 50) || null : null,
      email: idx.email !== -1 ? (cols[idx.email] || "").slice(0, 255) || null : null,
      address: idx.address !== -1 ? (cols[idx.address] || "").slice(0, 500) || null : null,
      notes: idx.notes !== -1 ? (cols[idx.notes] || "").slice(0, 1000) || null : null,
    };
  }).filter(r => r.name.length > 0);

  if (maxCustomers !== Infinity && currentCount + rows.length > maxCustomers) {
    return NextResponse.json(
      limitGateError("clientes", maxCustomers, profile.plan),
      { status: 403 }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await prisma.customer.create({
        data: { ...row, organizationId: profile.organizationId },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, imported, skipped });
}
