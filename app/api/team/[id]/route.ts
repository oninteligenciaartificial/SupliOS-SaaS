import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStaffSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  branchId: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: staffId } = await params;
  const staff = await prisma.profile.findUnique({
    where: { id: staffId },
  });

  if (!staff || staff.organizationId !== profile.organizationId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { role, branchId } = parsed.data;

  const updated = await prisma.profile.update({
    where: { id: staffId },
    data: {
      ...(role && { role }),
      ...(branchId !== undefined && { branchId: branchId || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getTenantProfile();
  if (!profile || profile.role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: staffId } = await params;
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
        { error: "No puedes eliminar el único administrador" },
        { status: 403 }
      );
    }
  }

  // Delete Supabase Auth user if not a placeholder
  if (!staff.userId.startsWith("temp_")) {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.auth.admin.deleteUser(staff.userId).catch(() => {});
  }

  await prisma.profile.delete({
    where: { id: staffId },
  });

  return new NextResponse(null, { status: 204 });
}
