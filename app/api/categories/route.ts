import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const showAll = searchParams.get("all") === "1";

  const where: Record<string, unknown> = { organizationId: profile.organizationId };
  if (!showAll) {
    where.businessType = profile.businessType ?? "GENERAL";
  }

  const categories = await prisma.category.findMany({
    where,
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (profile.role !== "ADMIN") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = schema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const category = await prisma.category.create({
    data: {
      organizationId: profile.organizationId,
      name: result.data.name.trim(),
      businessType: profile.businessType ?? "GENERAL",
    },
  });

  return NextResponse.json(category, { status: 201 });
}
