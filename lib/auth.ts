import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { PlanType } from "@/lib/plans";

/** Returns the profile of the authenticated user scoped to an organization,
 *  including the org's plan. Handles superadmin impersonation via cookie. */
export async function getTenantProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return null;

  // SUPERADMIN: impersonation takes absolute priority over own organizationId
  if (profile.role === "SUPERADMIN") {
    const cookieStore = await cookies();
    const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
    if (impersonateOrgId) {
      const org = await prisma.organization.findUnique({
        where: { id: impersonateOrgId },
        select: { plan: true, planExpiresAt: true, trialEndsAt: true },
      });
      return {
        ...profile,
        organizationId: impersonateOrgId,
        role: "ADMIN" as const,
        plan: (org?.plan ?? "BASICO") as PlanType,
        planExpiresAt: org?.planExpiresAt ?? null,
        trialEndsAt: org?.trialEndsAt ?? null,
      };
    }
    // SUPERADMIN without impersonation — belongs at /superadmin, not tenant dashboard
    return null;
  }

  // Regular user: clear stale impersonation cookies
  const cookieStore = await cookies();
  if (cookieStore.get("impersonate_org_id")) {
    cookieStore.delete("impersonate_org_id");
    cookieStore.delete("impersonate_org_name");
  }

  if (profile.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: profile.organizationId },
      select: { plan: true, planExpiresAt: true, trialEndsAt: true },
    });
    return {
      ...profile,
      organizationId: profile.organizationId,
      plan: (org?.plan ?? "BASICO") as PlanType,
      planExpiresAt: org?.planExpiresAt ?? null,
      trialEndsAt: org?.trialEndsAt ?? null,
    };
  }

  return null;
}
