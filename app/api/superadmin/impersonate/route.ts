import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") return null;
  return profile;
}

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
