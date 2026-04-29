import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendExpiryAlert } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringProducts = await prisma.product.findMany({
    where: {
      active: true,
      batchExpiry: { gte: now, lte: in7Days },
      organization: { plan: "EMPRESARIAL" },
    },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { batchExpiry: "asc" },
  });

  if (expiringProducts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Group by org
  const byOrg = new Map<string, typeof expiringProducts>();
  for (const p of expiringProducts) {
    const existing = byOrg.get(p.organizationId) ?? [];
    byOrg.set(p.organizationId, [...existing, p]);
  }

  const supabaseAdmin = createAdminClient();
  let sent = 0;

  for (const [orgId, products] of byOrg) {
    const adminProfiles = await prisma.profile.findMany({
      where: { organizationId: orgId, role: "ADMIN" },
      select: { userId: true },
    });

    const adminEmails = (await Promise.all(
      adminProfiles.map(p => supabaseAdmin.auth.admin.getUserById(p.userId).then(r => r.data.user?.email))
    )).filter(Boolean) as string[];

    const orgName = products[0].organization.name;
    const alertProducts = products.map(p => ({
      name: p.name,
      sku: p.sku,
      batchExpiry: p.batchExpiry!,
      daysLeft: Math.ceil((p.batchExpiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    for (const email of adminEmails) {
      await sendExpiryAlert({ to: email, orgName, products: alertProducts }).catch((error) => {
        reportAsyncError("cron.expiry.sendExpiryAlert", error, {
          organizationId: orgId,
          email,
          productCount: alertProducts.length,
        });
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
