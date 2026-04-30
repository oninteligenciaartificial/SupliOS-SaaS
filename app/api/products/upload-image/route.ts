import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:edit"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Imagen demasiado grande (máx 5 MB)" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Tipo no permitido (JPG, PNG, WebP, GIF)" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${profile.organizationId}/${Date.now()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
