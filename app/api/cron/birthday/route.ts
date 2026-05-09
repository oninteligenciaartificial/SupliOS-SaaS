import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBirthdayEmail, sendPlainNotification } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function verifyCronSecret(provided: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !provided) return false;
  if (secret.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(request: Request) {
  const rateLimited = checkRateLimit(request, "cron-birthday", RATE_LIMITS.cron);
  if (rateLimited) return rateLimited;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!verifyCronSecret(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const customers = await prisma.customer.findMany({
    where: { email: { not: null }, birthday: { not: null }, organization: { plan: "EMPRESARIAL" } },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  const birthdayCustomers = customers.filter(c => {
    if (!c.birthday) return false;
    return c.birthday.getMonth() + 1 === month && c.birthday.getDate() === day;
  });

  let sent = 0;
  const supabaseAdmin = createAdminClient();

  for (const customer of birthdayCustomers) {
    if (!customer.email) continue;

    const code = `CUMPLE${customer.name.split(" ")[0].toUpperCase()}${day}${month}`;
    const discountValue = 10;

    await prisma.discount.upsert({
      where: { organizationId_code: { organizationId: customer.organizationId, code } },
      update: { active: true, expiresAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) },
      create: {
        organizationId: customer.organizationId,
        code,
        description: `Descuento de cumpleanos para ${customer.name}`,
        type: "PORCENTAJE",
        value: discountValue,
        active: true,
        expiresAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
    });

    await sendBirthdayEmail({
      to: customer.email,
      customerName: customer.name,
      orgName: customer.organization.name,
      discountCode: code,
      discountValue,
    }).catch((error) => {
      reportAsyncError("cron.birthday.sendBirthdayEmail", error, {
        customerId: customer.id,
        organizationId: customer.organizationId,
        email: customer.email,
      });
    });

    sent++;
  }

  const orgIds = [...new Set(birthdayCustomers.map(c => c.organizationId))];
  for (const orgId of orgIds) {
    const adminProfiles = await prisma.profile.findMany({
      where: { organizationId: orgId, role: "ADMIN" },
      select: { userId: true },
    });
    const orgCustomers = birthdayCustomers.filter(c => c.organizationId === orgId);
    const orgName = orgCustomers[0]?.organization.name ?? "";

    for (const p of adminProfiles) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(p.userId);
      if (data.user?.email) {
        await sendPlainNotification({
          to: data.user.email,
          subject: `${orgCustomers.length} cliente(s) cumplen anos hoy — ${orgName}`,
          text: `Hoy cumplen anos: ${orgCustomers.map(c => c.name).join(", ")}. Se les envio automaticamente su codigo de descuento.`,
        }).catch((error) => {
          reportAsyncError("cron.birthday.sendPlainNotification", error, {
            organizationId: orgId,
            email: data.user?.email,
          });
        });
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
