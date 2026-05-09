import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const saveSchema = z.object({
  montoRealEfectivo: z.number().min(0),
  notas: z.string().optional(),
  branchId: z.string().optional(),
});

export async function GET(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const now = new Date();
  const target = dateParam ? new Date(dateParam) : now;
  const startOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const endOfDay = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1);

  const [orders, existingCorte] = await Promise.all([
    prisma.order.findMany({
      where: {
        organizationId: profile.organizationId,
        createdAt: { gte: startOfDay, lt: endOfDay },
        status: { not: "CANCELADO" },
      },
      select: { id: true, total: true, paymentMethod: true, createdAt: true, customerName: true, _count: { select: { items: true } } },
    }),
    prisma.cashRegister.findFirst({
      where: {
        organizationId: profile.organizationId,
        date: startOfDay,
      },
      select: {
        id: true,
        totalEfectivo: true,
        totalTarjeta: true,
        totalTransferencia: true,
        totalQr: true,
        montoRealEfectivo: true,
        diferencia: true,
        notas: true,
        createdAt: true,
      },
    }),
  ]);

  const totals = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, QR: 0 };
  for (const o of orders) {
    const pm = o.paymentMethod as keyof typeof totals;
    if (pm in totals) totals[pm] += Number(o.total);
  }

  return NextResponse.json({
    date: startOfDay.toISOString(),
    totalEfectivo: totals.EFECTIVO,
    totalTarjeta: totals.TARJETA,
    totalTransferencia: totals.TRANSFERENCIA,
    totalQr: totals.QR,
    totalVentas: totals.EFECTIVO + totals.TARJETA + totals.TRANSFERENCIA + totals.QR,
    totalOrders: orders.length,
    corte: existingCorte
      ? {
          id: existingCorte.id,
          montoRealEfectivo: Number(existingCorte.montoRealEfectivo),
          diferencia: Number(existingCorte.diferencia),
          notas: existingCorte.notas,
          savedAt: existingCorte.createdAt,
        }
      : null,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getTenantProfile();
  if (!profile || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!hasPermission(profile.role, "reports:view")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = saveSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos", details: result.error.issues }, { status: 400 });

  const { montoRealEfectivo, notas, branchId } = result.data;

  const staffProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { id: true } });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      organizationId: profile.organizationId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      status: { not: "CANCELADO" },
      ...(branchId ? { branchId } : {}),
    },
    select: { total: true, paymentMethod: true },
  });

  const totals = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, QR: 0 };
  for (const o of orders) {
    const pm = o.paymentMethod as keyof typeof totals;
    if (pm in totals) totals[pm] += Number(o.total);
  }

  const diferencia = montoRealEfectivo - totals.EFECTIVO;

  const existing = await prisma.cashRegister.findFirst({
    where: { organizationId: profile.organizationId, date: startOfDay, branchId: branchId ?? null },
    select: { id: true },
  });

  const corteData = {
    totalEfectivo: totals.EFECTIVO,
    totalTarjeta: totals.TARJETA,
    totalTransferencia: totals.TRANSFERENCIA,
    totalQr: totals.QR,
    montoRealEfectivo,
    diferencia,
    notas: notas ?? null,
  };

  const corte = existing
    ? await prisma.cashRegister.update({ where: { id: existing.id }, data: corteData })
    : await prisma.cashRegister.create({
        data: {
          ...corteData,
          organizationId: profile.organizationId,
          staffId: staffProfile?.id ?? null,
          branchId: branchId ?? null,
          date: startOfDay,
        },
      });

  return NextResponse.json({ ok: true, corteId: corte.id, diferencia });
}
