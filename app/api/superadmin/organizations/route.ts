import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/superadmin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  orgName: z.string().min(1),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  plan: z.enum(["BASICO", "CRECER", "PRO", "EMPRESARIAL"]).default("BASICO"),
});

// GET — lista todas las organizaciones
export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const orgs = await prisma.organization.findMany({
    include: {
      _count: { select: { profiles: true, products: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orgs);
}

// POST — crea nueva organización + usuario ADMIN
export async function POST(request: Request) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rateLimited = checkRateLimit(request, "superadmin-create-org", { windowMs: 60_000, max: 5 });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { orgName, adminName, adminEmail, adminPassword, plan } = result.data;

  const slug = orgName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50) + "-" + Date.now().toString(36);

  // Crear usuario en Supabase Auth
  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Crear org + perfil ADMIN en transaccion
  const org = await prisma.organization.create({
    data: {
      name: orgName.trim(),
      slug,
      plan,
      profiles: {
        create: {
          userId: authData.user.id,
          name: adminName.trim(),
          role: "ADMIN",
        },
      },
    },
  });

  return NextResponse.json(org, { status: 201 });
}
