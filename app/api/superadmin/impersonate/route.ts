import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSuperAdmin } from "@/lib/superadmin";

export async function POST(request: Request) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }
  const { orgId } = body as { orgId: string };
  if (!orgId) return NextResponse.json({ error: "orgId requerido" }, { status: 400 });

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Organizacion no encontrada" }, { status: 404 });

  const cookieStore = await cookies();
  cookieStore.set("impersonate_org_id", orgId, { httpOnly: true, path: "/", sameSite: "lax" });
  cookieStore.set("impersonate_org_name", org.name, { httpOnly: true, path: "/", sameSite: "lax" });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const cookieStore = await cookies();
  cookieStore.delete("impersonate_org_id");
  cookieStore.delete("impersonate_org_name");

  return NextResponse.json({ ok: true });
}
