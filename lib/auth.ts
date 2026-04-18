import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/** Returns the profile of the authenticated user that has an organizationId.
 *  If the user is a SUPERADMIN impersonating an org (via cookie), returns a
 *  synthetic profile scoped to that org with ADMIN role. */
export async function getTenantProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return null;

  if (profile.organizationId) {
    return profile as typeof profile & { organizationId: string };
  }

  if (profile.role === "SUPERADMIN") {
    const cookieStore = await cookies();
    const impersonateOrgId = cookieStore.get("impersonate_org_id")?.value;
    if (impersonateOrgId) {
      return { ...profile, organizationId: impersonateOrgId, role: "ADMIN" as const };
    }
  }

  return null;
}
