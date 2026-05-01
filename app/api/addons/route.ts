import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlanAtLeast } from "@/lib/plans";
import { z } from "zod";

const schema = z.object({
  addon: z.enum(["WHATSAPP", "FACTURACION", "QR_BOLIVIA", "ECOMMERCE", "CONTABILIDAD"]),
  active: z.boolean(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const addons = await prisma.orgAddon.findMany({
    where: { organizationId: profile.organizationId },
  });

  return NextResponse.json(addons);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Add-ons require at least CRECER plan
  if (!isPlanAtLeast(profile.plan, "CRECER")) {
    return NextResponse.json(
      { error: "Los add-ons estan disponibles desde el plan Crecer.", upgrade: true, requiredPlan: "CRECER" },
      { status: 403 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const addon = await prisma.orgAddon.upsert({
    where: { organizationId_addon: { organizationId: profile.organizationId, addon: result.data.addon } },
    create: { organizationId: profile.organizationId, addon: result.data.addon, active: result.data.active },
    update: { active: result.data.active },
  });

  return NextResponse.json(addon);
}
