import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const variantSchema = z.object({
  attributes: z.record(z.string(), z.string()),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  price: z.number().min(0).optional(),
});

const patchSchema = variantSchema.partial().extend({
  active: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const variants = await prisma.productVariant.findMany({
    where: { productId, organizationId: profile.organizationId, active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(variants);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:create"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = variantSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  // Verify product belongs to this org
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId: profile.organizationId },
  });
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const variant = await prisma.productVariant.create({
    data: {
      organizationId: profile.organizationId,
      productId,
      attributes: result.data.attributes,
      sku: result.data.sku ?? null,
      stock: result.data.stock,
      price: result.data.price ?? null,
    },
  });

  return NextResponse.json(variant, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:edit"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const url = new URL(req.url);
  const variantId = url.searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "variantId requerido" }, { status: 400 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = patchSchema.safeParse(body);
  if (!result.success)
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const variant = await prisma.productVariant.updateMany({
    where: { id: variantId, productId, organizationId: profile.organizationId },
    data: {
      ...(result.data.attributes ? { attributes: result.data.attributes } : {}),
      ...(result.data.sku !== undefined ? { sku: result.data.sku ?? null } : {}),
      ...(result.data.stock !== undefined ? { stock: result.data.stock } : {}),
      ...(result.data.price !== undefined ? { price: result.data.price ?? null } : {}),
      ...(result.data.active !== undefined ? { active: result.data.active } : {}),
    },
  });

  if (variant.count === 0)
    return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:delete"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const url = new URL(req.url);
  const variantId = url.searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "variantId requerido" }, { status: 400 });

  await prisma.productVariant.updateMany({
    where: { id: variantId, productId, organizationId: profile.organizationId },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
