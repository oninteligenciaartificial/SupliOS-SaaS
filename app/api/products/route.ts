import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PLAN_LIMITS } from "@/lib/plans";
import { hasPermission } from "@/lib/permissions";
import { checkOrgRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  price: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  batchExpiry: z.string().optional(),
  imageUrl: z.string().optional(),
  hasVariants: z.boolean().default(false),
  attributeSchema: z.record(z.string(), z.array(z.string())).optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));
  const skip = (page - 1) * limit;

  const where = {
    organizationId: profile.organizationId,
    active: true,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        variants: { where: { active: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ data: products, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "products:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  // Rate limit: 30 product creations per minute per org
  const rateLimited = checkOrgRateLimit(profile.organizationId, "products", { windowMs: 60_000, max: 30 });
  if (rateLimited) return rateLimited;

  const { maxProducts } = PLAN_LIMITS[profile.plan];
  if (isFinite(maxProducts)) {
    const count = await prisma.product.count({ where: { organizationId: profile.organizationId, active: true } });
    if (count >= maxProducts) {
      return NextResponse.json({ error: `Tu plan permite hasta ${maxProducts} productos activos. Actualiza tu plan para agregar más.`, upgrade: true, requiredPlan: "PRO" }, { status: 403 });
    }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { name, description, sku, barcode, unit, categoryId, supplierId, price, cost, stock, minStock, batchExpiry, imageUrl, hasVariants, attributeSchema } = result.data;

  const product = await prisma.product.create({
    data: {
      organizationId: profile.organizationId,
      name: name.trim(),
      description: description ?? null,
      sku: sku ?? null,
      barcode: barcode ?? null,
      unit: unit ?? null,
      categoryId: categoryId ?? null,
      supplierId: supplierId ?? null,
      price,
      cost,
      stock: hasVariants ? 0 : stock,
      minStock,
      batchExpiry: batchExpiry ? new Date(batchExpiry) : null,
      imageUrl: imageUrl ?? null,
      hasVariants,
      attributeSchema: (attributeSchema ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
    },
  });

  logAudit({ orgId: profile.organizationId, orgPlan: profile.plan, userId: profile.userId, action: "create", entityType: "product", entityId: product.id, after: { name: product.name, price: product.price, stock: product.stock } });

  return NextResponse.json(product, { status: 201 });
}
