import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const staffQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
});

const createStaffSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  role: z.enum(["MANAGER", "STAFF", "VIEWER"], { message: "Rol no permitido" }),
  branchId: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "staff:manage")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = staffQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { page, limit } = parsed.data;
  const p = Math.max(1, parseInt(page));
  const l = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (p - 1) * l;

  const [total, data] = await Promise.all([
    prisma.profile.count({
      where: { organizationId: profile.organizationId },
    }),
    prisma.profile.findMany({
      where: { organizationId: profile.organizationId },
      select: {
        id: true,
        userId: true,
        name: true,
        role: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        branch: { select: { id: true, name: true } },
      },
      skip,
      take: l,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pages = Math.ceil(total / l);
  return NextResponse.json({
    data,
    meta: { total, page: p, limit: l, pages },
  });
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "staff:manage")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { name, role, branchId } = parsed.data;

  const staffLimit = {
    BASICO: 1,
    CRECER: 3,
    PRO: 10,
    EMPRESARIAL: Infinity,
  }[profile.plan];

  const staffCount = await prisma.profile.count({
    where: { organizationId: profile.organizationId },
  });

  if (staffCount >= staffLimit) {
    return NextResponse.json(
      { error: `Tu plan permite hasta ${staffLimit} miembros del equipo.`, upgrade: true },
      { status: 403 }
    );
  }

  // Validate branchId if provided
  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.organizationId !== profile.organizationId) {
      return NextResponse.json({ error: "Sucursal no válida" }, { status: 400 });
    }
  }

  // TODO: integrate with Supabase Auth to create user + send invite email
  // For now, create profile with placeholder userId
  const userId = `temp_${Date.now()}`;

  const newStaff = await prisma.profile.create({
    data: {
      userId,
      organizationId: profile.organizationId,
      name,
      role,
      branchId,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(newStaff, { status: 201 });
}
