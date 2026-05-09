import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  organizationName: z.string().min(1).max(100),
  userName: z.string().min(1).max(100),
  businessType: z.enum(["GENERAL", "ROPA", "SUPLEMENTOS", "ELECTRONICA", "FARMACIA", "FERRETERIA"]).optional(),
});

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, "setup", RATE_LIMITS.setup);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Solo permite el setup si este usuario no tiene perfil todavia
  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) return NextResponse.json({ error: "Ya tienes una cuenta configurada" }, { status: 409 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { organizationName, userName, businessType } = result.data;

  // Crear slug unico a partir del nombre
  const slug = organizationName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50) + "-" + Date.now().toString(36);

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [org] = await prisma.$transaction([
    prisma.organization.create({
      data: {
        name: organizationName.trim(),
        slug,
        trialEndsAt,
        businessType: businessType ?? "GENERAL",
        profiles: {
          create: {
            userId: user.id,
            name: userName.trim(),
            role: "ADMIN",
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ organizationId: org.id }, { status: 201 });
}
