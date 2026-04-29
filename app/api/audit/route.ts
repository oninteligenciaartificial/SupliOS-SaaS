import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canUseFeature(profile.plan, "audit_log")) {
    return NextResponse.json({ error: "Requiere plan Empresarial" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const entityType = searchParams.get("entityType") ?? undefined;
  const skip = (page - 1) * limit;

  const where = {
    organizationId: profile.organizationId,
    ...(entityType ? { entityType } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ data: logs, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}
