import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdmin } from "@/lib/superadmin";
import { sendPlanActivatedEmail } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["CONFIRMADO", "RECHAZADO"]),
});

export async function GET() {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const requests = await prisma.paymentRequest.findMany({
    include: {
      organization: { select: { id: true, name: true, slug: true, plan: true, planExpiresAt: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(requests);
}

export async function PATCH(request: Request) {
  const admin = await getSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const result = actionSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });

  const { action } = result.data;

  const payReq = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { organization: { select: { id: true, name: true, planExpiresAt: true } } },
  });

  if (!payReq) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (payReq.status !== "PENDIENTE") return NextResponse.json({ error: "Ya procesado" }, { status: 409 });

  await prisma.paymentRequest.update({
    where: { id },
    data: { status: action, confirmedAt: new Date(), confirmedBy: admin.id },
  });

  if (action === "CONFIRMADO") {
    const base = payReq.organization.planExpiresAt && payReq.organization.planExpiresAt > new Date()
      ? payReq.organization.planExpiresAt
      : new Date();
    const newExpiry = new Date(base);
    newExpiry.setMonth(newExpiry.getMonth() + payReq.months);

    await prisma.organization.update({
      where: { id: payReq.organizationId },
      data: { plan: payReq.plan, planExpiresAt: newExpiry },
    });

    // Notify admin of the org
    const adminProfile = await prisma.profile.findFirst({
      where: { organizationId: payReq.organizationId, role: "ADMIN" },
      select: { userId: true, name: true },
    });
    if (adminProfile) {
      const { data: { user } } = await (await import("@/lib/supabase/admin")).createAdminClient().auth.admin.getUserById(adminProfile.userId);
      if (user?.email) {
        sendPlanActivatedEmail({
          to: user.email,
          orgName: payReq.organization.name,
          plan: payReq.plan,
          expiresAt: newExpiry,
        }).catch((error) => {
          reportAsyncError("api.superadmin.payments.sendPlanActivatedEmail", error, {
            organizationId: payReq.organizationId,
            paymentRequestId: payReq.id,
          });
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
