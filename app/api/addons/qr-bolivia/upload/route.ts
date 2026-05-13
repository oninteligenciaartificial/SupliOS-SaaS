import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });

  // Upload to Supabase Storage
  const supabase = createAdminClient();
  const fileName = `${profile.organizationId}/qr-bolivia-${Date.now()}.${file.name.split(".").pop()}`;
  const { data, error } = await supabase.storage
    .from("org-assets")
    .upload(fileName, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("org-assets")
    .getPublicUrl(data.path);

  // Update or create the QR_BOLIVIA addon with the image URL
  const existingAddon = await prisma.orgAddon.findUnique({
    where: { organizationId_addon: { organizationId: profile.organizationId, addon: "QR_BOLIVIA" } },
  });

  if (existingAddon) {
    await prisma.orgAddon.update({
      where: { id: existingAddon.id },
      data: { active: true, phoneNumberId: urlData.publicUrl },
    });
  } else {
    await prisma.orgAddon.create({
      data: {
        organizationId: profile.organizationId,
        addon: "QR_BOLIVIA",
        active: true,
        phoneNumberId: urlData.publicUrl,
      },
    });
  }

  return NextResponse.json({ ok: true, url: urlData.publicUrl }, { status: 201 });
}
