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

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "customers-export", RATE_LIMITS.export);
  if (rateLimited) return rateLimited;

  const customers = await prisma.customer.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { name: "asc" },
  });

  const header = "Nombre,Telefono,Email,RFC,Direccion,Puntos de Lealtad,Cumpleanos,Notas";
  const rows = customers.map((c) => {
    const fields = [
      c.name,
      c.phone ?? "",
      c.email ?? "",
      c.rfc ?? "",
      c.address ?? "",
      String(c.loyaltyPoints),
      c.birthday ? c.birthday.toISOString().split("T")[0] : "",
      c.notes ?? "",
    ];
    return fields.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [header, ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${Date.now()}.csv"`,
    },
  });
}
