import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, planGateError, PLAN_LIMITS } from "@/lib/plans";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const members = await prisma.profile.findMany({
    where: { organizationId: profile.organizationId },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // Rate limit: 5 invitations per minute per org
  const rateLimited = checkOrgRateLimit(profile.organizationId, "team", { windowMs: 60_000, max: 5 });
  if (rateLimited) return rateLimited;

  if (!canUseFeature(profile.plan, "staff")) return NextResponse.json(planGateError("staff"), { status: 403 });

  const { maxStaff } = PLAN_LIMITS[profile.plan];
  if (isFinite(maxStaff)) {
    const currentCount = await prisma.profile.count({ where: { organizationId: profile.organizationId } });
    if (currentCount > maxStaff) {
      return NextResponse.json({ error: `Tu plan permite máximo ${maxStaff} usuarios adicionales al admin.`, upgrade: true, requiredPlan: "EMPRESARIAL" }, { status: 403 });
    }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createUserSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { name, email, password, role } = result.data;

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Error al crear usuario" }, { status: 400 });
  }

  const newProfile = await prisma.profile.create({
    data: {
      userId: authData.user.id,
      organizationId: profile.organizationId,
      name: name.trim(),
      role,
    },
  });

  return NextResponse.json(newProfile, { status: 201 });
}
