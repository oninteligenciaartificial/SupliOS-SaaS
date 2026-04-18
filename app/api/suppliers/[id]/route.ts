import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.supplier.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const d = result.data;
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { ...(d.name ? { name: d.name } : {}), contact: d.contact ?? null, phone: d.phone ?? null, email: d.email || null, notes: d.notes ?? null },
  });
  return NextResponse.json(supplier);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.supplier.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
