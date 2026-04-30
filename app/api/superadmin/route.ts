import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/superadmin";

// GET /api/superadmin — stats generales de la plataforma
export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const [totalOrgs, totalUsers, totalOrders] = await Promise.all([
    prisma.organization.count(),
    prisma.profile.count(),
    prisma.order.count(),
  ]);

  return NextResponse.json({ totalOrgs, totalUsers, totalOrders });
}
