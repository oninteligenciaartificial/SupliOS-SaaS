import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/superadmin";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(["BASICO", "CRECER", "PRO", "EMPRESARIAL"]).optional(),
  planExpiresAt: z.string().datetime().optional().nullable(),
  action: z.literal("extend_trial").optional(),
  days: z.number().int().min(1).max(30).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }
  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { action, days, ...updateData } = result.data;

  if (action === "extend_trial") {
    const extensionDays = days ?? 7;
    const current = await prisma.organization.findUnique({ where: { id }, select: { trialEndsAt: true } });
    if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const base = current.trialEndsAt && current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
    const newTrialEndsAt = new Date(base.getTime() + extensionDays * 24 * 60 * 60 * 1000);
    const org = await prisma.organization.update({ where: { id }, data: { trialEndsAt: newTrialEndsAt } });
    return NextResponse.json(org);
  }

  const org = await prisma.organization.update({ where: { id }, data: updateData });
  return NextResponse.json(org);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  await prisma.organization.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
