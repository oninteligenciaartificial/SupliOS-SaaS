import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  rfc: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "customers:view")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));
  const skip = (page - 1) * limit;

  const where = {
    organizationId: profile.organizationId,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ data: customers, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "customers:create")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { maxCustomers } = PLAN_LIMITS[profile.plan];
  if (isFinite(maxCustomers)) {
    const count = await prisma.customer.count({ where: { organizationId: profile.organizationId } });
    if (count >= maxCustomers) {
      return NextResponse.json({ error: `Tu plan permite hasta ${maxCustomers} clientes. Actualiza tu plan para agregar más.`, upgrade: true, requiredPlan: "PRO" }, { status: 403 });
    }
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      organizationId: profile.organizationId,
      name: result.data.name.trim(),
      phone: result.data.phone ?? null,
      email: result.data.email || null,
      address: result.data.address ?? null,
      rfc: result.data.rfc ?? null,
      birthday: result.data.birthday ? new Date(result.data.birthday) : null,
      notes: result.data.notes ?? null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
