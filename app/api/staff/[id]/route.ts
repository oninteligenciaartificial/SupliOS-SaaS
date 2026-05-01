import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStaffSchema = z.object({
  role: z.enum(["MANAGER", "STAFF", "VIEWER"]).optional(),
  branchId: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "staff:manage")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const staffId = params.id;
  const staff = await prisma.profile.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { role, branchId } = parsed.data;

  // Validate branchId if provided
  if (branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.organizationId !== profile.organizationId) {
      return NextResponse.json({ error: "Sucursal no válida" }, { status: 400 });
    }
  }

  const updated = await prisma.profile.update({
    where: { id: staffId },
    data: {
      ...(role && { role }),
      ...(branchId !== undefined && { branchId: branchId || null }),
    },
    select: {
      id: true,
      userId: true,
      email: true,
      name: true,
      role: true,
      branchId: true,
      updatedAt: true,
      branch: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "staff:manage")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const staffId = params.id;
  const staff = await prisma.profile.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // Prevent deleting the only ADMIN
  if (staff.role === "ADMIN") {
    const adminCount = await prisma.profile.count({
      where: {
        organizationId: profile.organizationId,
        role: "ADMIN",
      },
    });
    if (adminCount === 1) {
      return NextResponse.json(
        { error: "No puedes eliminar el único administrador de la organización" },
        { status: 403 }
      );
    }
  }

  await prisma.profile.delete({
    where: { id: staffId },
  });

  return NextResponse.json({ success: true }, { status: 204 });
}
