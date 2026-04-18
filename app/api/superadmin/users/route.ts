import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.role !== "SUPERADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const users = await prisma.profile.findMany({
    where: { role: { not: "SUPERADMIN" } },
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
