import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  active: z.boolean().optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.discount.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const d = result.data;
  const discount = await prisma.discount.update({
    where: { id },
    data: {
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.expiresAt !== undefined ? { expiresAt: d.expiresAt ? new Date(d.expiresAt) : null } : {}),
    },
  });
  return NextResponse.json(discount);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.discount.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.discount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
