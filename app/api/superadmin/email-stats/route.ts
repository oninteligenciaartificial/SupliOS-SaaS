import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "SUPERADMIN" && profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type");
  const statusFilter = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const where: Record<string, unknown> = {};
  if (typeFilter) where.type = typeFilter;
  if (statusFilter) where.status = statusFilter;

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailLog.count({ where }),
  ]);

  // Stats (always for all logs, not filtered)
  const stats = await prisma.emailLog.groupBy({
    by: ["status"],
    _count: true,
  });

  const statsObj = {
    total,
    sent: stats.find(s => s.status === "SENT")?._count ?? 0,
    delivered: stats.find(s => s.status === "DELIVERED")?._count ?? 0,
    bounced: stats.find(s => s.status === "BOUNCED")?._count ?? 0,
    failed: stats.find(s => s.status === "FAILED")?._count ?? 0,
  };

  return NextResponse.json({
    logs,
    stats: statsObj,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
