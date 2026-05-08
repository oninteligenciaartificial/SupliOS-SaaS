import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "STAFF", "MANAGER", "VIEWER"]),
  organizationId: z.string().optional(),
  password: z.string().min(8),
});

// GET — lista todos los usuarios no-SUPERADMIN
export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request, "superadmin-users", { windowMs: 60_000, max: 30 });
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const users = await prisma.profile.findMany({
    where: { role: { not: "SUPERADMIN" } },
    include: { organization: { select: { name: true } } },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(users);
}

// POST — crea nuevo usuario
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const adminProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!adminProfile || adminProfile.role !== "SUPERADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const rateLimited = checkRateLimit(request, "superadmin-create-user", { windowMs: 60_000, max: 5 });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { email, name, role, organizationId, password } = result.data;

  // Verificar que la organizacion existe si se proporciona
  if (organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) return NextResponse.json({ error: "Organizacion no encontrada" }, { status: 404 });
  }

  // Crear usuario en Supabase Auth
  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Crear perfil
  const newProfile = await prisma.profile.create({
    data: {
      userId: authData.user.id,
      name: name.trim(),
      role,
      organizationId: organizationId ?? null,
    },
    include: { organization: { select: { name: true } } },
  });

  return NextResponse.json(newProfile, { status: 201 });
}
