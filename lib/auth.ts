import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { PlanType } from "@/lib/plans";
import { setSentryUser } from "@/lib/monitoring";

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
        select: { plan: true, planExpiresAt: true, trialEndsAt: true, businessType: true },
      });
      const result = {
        ...profile,
        organizationId: impersonateOrgId,
        role: "ADMIN" as const,
        plan: (org?.plan ?? "BASICO") as PlanType,
        planExpiresAt: org?.planExpiresAt ?? null,
        trialEndsAt: org?.trialEndsAt ?? null,
        businessType: org?.businessType ?? "GENERAL",
      };
      // Set Sentry user context for error tracking
      setSentryUser({
        id: user.id,
        email: user.email,
        organizationId: impersonateOrgId,
        role: "ADMIN",
      }).catch(() => {});
      return result;
    }
    // SUPERADMIN without impersonation — belongs at /superadmin, not tenant dashboard
    return null;
  }

  // Regular user — always uses their own organizationId, impersonation cookies are irrelevant
  if (profile.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: profile.organizationId },
      select: { plan: true, planExpiresAt: true, trialEndsAt: true, businessType: true },
    });
    const result = {
      ...profile,
      organizationId: profile.organizationId,
      plan: (org?.plan ?? "BASICO") as PlanType,
      planExpiresAt: org?.planExpiresAt ?? null,
      trialEndsAt: org?.trialEndsAt ?? null,
      businessType: org?.businessType ?? "GENERAL",
    };
    // Set Sentry user context for error tracking
    setSentryUser({
      id: user.id,
      email: user.email,
      organizationId: profile.organizationId,
      role: profile.role,
    }).catch(() => {});
    return result;
  }

  return null;
}
