import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInactiveCustomerEmail } from "@/lib/email";
import { reportAsyncError } from "@/lib/monitoring";

// Runs daily — sends reactivation emails to customers who haven't ordered in 30 days
// Only for EMPRESARIAL orgs (email_advanced feature)
export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Find customers with email who haven't ordered in 30+ days, in EMPRESARIAL orgs
  const customers = await prisma.customer.findMany({
    where: {
      email: { not: null },
      organization: { plan: "EMPRESARIAL" },
      orders: { none: { createdAt: { gte: thirtyDaysAgo } } },
    },
    include: { organization: { select: { name: true } } },
  });

  let sent = 0;

  for (const customer of customers) {
    if (!customer.email) continue;

    // Find last order to calculate exact days
    const lastOrder = await prisma.order.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Skip if no orders at all (new customer, not inactive)
    if (!lastOrder) continue;

    const daysSince = Math.floor(
      (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    await sendInactiveCustomerEmail({
      to: customer.email,
      customerName: customer.name,
      orgName: customer.organization.name,
      daysSinceLastOrder: daysSince,
    }).catch((error) => {
      reportAsyncError("cron.inactiveCustomers.sendInactiveCustomerEmail", error, {
        customerId: customer.id,
        organizationId: customer.organizationId,
        email: customer.email,
      });
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
