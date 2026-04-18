import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.category.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const category = await prisma.category.update({ where: { id }, data: { name: result.data.name.trim() } });
  return NextResponse.json(category);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.category.findFirst({ where: { id, organizationId: profile.organizationId } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.category.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
