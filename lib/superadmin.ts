import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") return null;
  return profile;
}
