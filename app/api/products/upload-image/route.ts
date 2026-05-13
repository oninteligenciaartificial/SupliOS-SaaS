import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkOrgRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { randomBytes } from "crypto";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;

const MAGIC_BYTES: Record<string, { bytes: number[]; mime: string; offset: number }[]> = {
  "image/jpeg": [{ bytes: [0xFF, 0xD8, 0xFF], mime: "image/jpeg", offset: 0 }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mime: "image/png", offset: 0 }],
  "image/gif": [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mime: "image/gif", offset: 0 },
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mime: "image/gif", offset: 0 },
  ],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp", offset: 0 },
    { bytes: [0x57, 0x45, 0x42, 0x50], mime: "image/webp", offset: 8 },
  ],
};

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function generateSafeFilename(mime: string): string {
  const ext = MIME_TO_EXT[mime] ?? "jpg";
  const random = randomBytes(16).toString("hex");
  return `${random}.${ext}`;
}

async function detectMimeFromBuffer(buffer: ArrayBuffer): Promise<string | null> {
  const bytes = new Uint8Array(buffer);
  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (bytes.length >= sig.offset + sig.bytes.length) {
        let match = true;
        for (let i = 0; i < sig.bytes.length; i++) {
          if (bytes[sig.offset + i] !== sig.bytes[i]) { match = false; break; }
        }
        if (match) return mime;
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:edit"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const rateLimited = await checkOrgRateLimit(profile.organizationId, "upload-image", RATE_LIMITS.upload);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Imagen demasiado grande (máx 5 MB)" }, { status: 400 });

  const buffer = await file.slice(0, 12).arrayBuffer();
  const realMime = await detectMimeFromBuffer(buffer);
  if (!realMime || !ALLOWED_MIMES.includes(realMime)) {
    return NextResponse.json({ error: "Tipo no permitido (JPG, PNG, WebP, GIF)" }, { status: 400 });
  }

  const safeFilename = generateSafeFilename(realMime);
  const path = `${profile.organizationId}/${safeFilename}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: realMime,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
