import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/plans";
import type { PlanType } from "@/lib/plans";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      plan: true,
      currency: true,
    },
  });

  if (!org) return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  if (!canUseFeature(org.plan as PlanType, "tienda_online"))
    return NextResponse.json({ error: "Tienda no disponible" }, { status: 403 });

  const products = await prisma.product.findMany({
    where: { organizationId: org.id, active: true },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      hasVariants: true,
      category: { select: { name: true } },
      variants: {
        where: { active: true },
        select: { id: true, attributes: true, price: true, stock: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ name: org.name, currency: org.currency, products });
}
