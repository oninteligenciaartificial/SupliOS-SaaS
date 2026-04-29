import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPlanExpiryWarning, sendPlanExpired } from "@/lib/email";
import { PLAN_META } from "@/lib/plans";
import { reportAsyncError } from "@/lib/monitoring";

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const supabaseAdmin = createAdminClient();

  let warnings = 0;
  let expired = 0;

  // Orgs expiring in the next 7 days (but not yet expired)
  const expiringOrgs = await prisma.organization.findMany({
    where: {
      planExpiresAt: { gte: now, lte: in7Days },
    },
    select: { id: true, name: true, plan: true, planExpiresAt: true },
  });

  for (const org of expiringOrgs) {
    const daysLeft = Math.ceil((org.planExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const planLabel = PLAN_META[org.plan].label;

    const admins = await prisma.profile.findMany({
      where: { organizationId: org.id, role: "ADMIN" },
      select: { userId: true },
    });

    for (const admin of admins) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(admin.userId);
      if (data.user?.email) {
        await sendPlanExpiryWarning({ to: data.user.email, orgName: org.name, daysLeft, planLabel }).catch((error) => {
          reportAsyncError("cron.planExpiry.sendPlanExpiryWarning", error, {
            organizationId: org.id,
            daysLeft,
            email: data.user?.email,
          });
        });
        warnings++;
      }
    }
  }

  // Orgs that expired (planExpiresAt in the past, trialEndsAt also past or null)
  const expiredOrgs = await prisma.organization.findMany({
    where: {
      planExpiresAt: { lt: now },
      OR: [{ trialEndsAt: null }, { trialEndsAt: { lt: now } }],
    },
    select: { id: true, name: true, plan: true, planExpiresAt: true },
  });

  for (const org of expiredOrgs) {
    const planLabel = PLAN_META[org.plan].label;

    // Only send expired email if it expired today (within last 24h)
    const expiredRecently = org.planExpiresAt && (now.getTime() - org.planExpiresAt.getTime()) < 24 * 60 * 60 * 1000;
    if (!expiredRecently) continue;

    const admins = await prisma.profile.findMany({
      where: { organizationId: org.id, role: "ADMIN" },
      select: { userId: true },
    });

    for (const admin of admins) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(admin.userId);
      if (data.user?.email) {
        await sendPlanExpired({ to: data.user.email, orgName: org.name, planLabel }).catch((error) => {
          reportAsyncError("cron.planExpiry.sendPlanExpired", error, {
            organizationId: org.id,
            email: data.user?.email,
          });
        });
        expired++;
      }
    }
  }

  return NextResponse.json({ ok: true, warnings, expired });
}
