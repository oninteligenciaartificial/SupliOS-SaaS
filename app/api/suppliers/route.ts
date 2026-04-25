import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError } from "@/lib/plans";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "suppliers")) return NextResponse.json(planGateError("suppliers"), { status: 403 });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "suppliers:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      organizationId: profile.organizationId,
      name: result.data.name.trim(),
      contact: result.data.contact ?? null,
      phone: result.data.phone ?? null,
      email: result.data.email ?? null,
      notes: result.data.notes ?? null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
