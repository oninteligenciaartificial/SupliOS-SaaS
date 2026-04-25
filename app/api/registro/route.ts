import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { canUseFeature } from "@/lib/plans";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  birthday: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { slug, name, email, phone, birthday } = result.data;

  const org = await prisma.organization.findUnique({ where: { slug }, select: { id: true, name: true, plan: true } });
  if (!org) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  if (!canUseFeature(org.plan as Parameters<typeof canUseFeature>[0], "registro_publico")) {
    return NextResponse.json({ error: "Esta tienda no tiene registro público habilitado" }, { status: 403 });
  }

  // Prevent duplicate email in same org
  if (email) {
    const existing = await prisma.customer.findFirst({ where: { organizationId: org.id, email } });
    if (existing) return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      birthday: birthday ? new Date(birthday) : null,
    },
  });

  if (customer.email) {
    sendWelcomeEmail({ to: customer.email, customerName: customer.name, orgName: org.name }).catch(() => {});
  }

  return NextResponse.json({ ok: true, customerId: customer.id, orgName: org.name });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true },
  });

  if (!org) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  return NextResponse.json(org);
}
