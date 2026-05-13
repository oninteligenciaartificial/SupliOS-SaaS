import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const adminProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!adminProfile || adminProfile.role !== "SUPERADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const rateLimited = await checkRateLimit(request, "superadmin-delete-user", { windowMs: 60_000, max: 10 });
  if (rateLimited) return rateLimited;

  const { id } = await params;

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // No permitir eliminar otros SUPERADMIN
  if (profile.role === "SUPERADMIN") {
    return NextResponse.json({ error: "No se pueden eliminar usuarios superadmin" }, { status: 403 });
  }

  // Eliminar usuario de Supabase Auth
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.auth.admin.deleteUser(profile.userId).catch(() => {});

  // Eliminar perfil
  await prisma.profile.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
