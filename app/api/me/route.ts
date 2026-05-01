import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  // If superadmin is impersonating an org, attach that org's data
  if (profile.role === "SUPERADMIN") {
    const cookieStore = await cookies();
    const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
    if (impersonateOrgId) {
      const [org, addons] = await Promise.all([
        prisma.organization.findUnique({ where: { id: impersonateOrgId } }),
        prisma.orgAddon.findMany({ where: { organizationId: impersonateOrgId, active: true }, select: { addon: true } }),
      ]);
      return NextResponse.json({ ...profile, role: "ADMIN", organization: org, email: user.email, activeAddons: addons.map((a) => a.addon) });
    }
  }

  const addons = profile.organizationId
    ? await prisma.orgAddon.findMany({ where: { organizationId: profile.organizationId, active: true }, select: { addon: true } })
    : [];

  return NextResponse.json({ ...profile, email: user.email, activeAddons: addons.map((a) => a.addon) });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  orgName: z.string().min(1).optional(),
  orgPhone: z.string().optional(),
  orgAddress: z.string().optional(),
  orgRfc: z.string().optional(),
  orgLogoUrl: z.string().optional(),
  orgCurrency: z.string().optional(),
  orgBusinessType: z.string().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  // Resolve org ID — could be own org or impersonated org
  let orgId = profile.organizationId;
  let effectiveRole = profile.role;
  if (profile.role === "SUPERADMIN") {
    const cookieStore = await cookies();
    const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
    if (impersonateOrgId) { orgId = impersonateOrgId; effectiveRole = "ADMIN"; }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = patchSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { name, orgName, orgPhone, orgAddress, orgRfc, orgLogoUrl, orgCurrency, orgBusinessType } = result.data;

  await prisma.profile.update({
    where: { id: profile.id },
    data: { ...(name ? { name } : {}) },
  });

  if (orgId && effectiveRole === "ADMIN") {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(orgName ? { name: orgName } : {}),
        phone: orgPhone ?? undefined,
        address: orgAddress ?? undefined,
        rfc: orgRfc ?? undefined,
        logoUrl: orgLogoUrl ?? undefined,
        currency: orgCurrency ?? undefined,
        businessType: orgBusinessType ?? undefined,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
