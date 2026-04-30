import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  rfc: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "customers:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data = result.data;
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      phone: data.phone ?? null,
      email: data.email || null,
      address: data.address ?? null,
      rfc: data.rfc ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      notes: data.notes ?? null,
    },
  });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "update", entityType: "customer", entityId: id, before: { name: existing.name, phone: existing.phone, email: existing.email }, after: { name: customer.name, phone: customer.phone, email: customer.email } });

  return NextResponse.json(customer);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "customers:edit")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.customer.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.customer.delete({ where: { id } });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "delete", entityType: "customer", entityId: id, before: { name: existing.name }, after: null });

  return NextResponse.json({ ok: true });
}
