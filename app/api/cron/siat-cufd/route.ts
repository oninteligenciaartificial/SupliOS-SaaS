import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshCUFD } from "@/lib/siat";
import { reportAsyncError } from "@/lib/monitoring";

// Runs daily at 06:00 — refreshes CUFD for all orgs with SIAT addon active
export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    where: {
      nitEmisor: { not: null },
      addons: { some: { addon: "FACTURACION", active: true } },
    },
    select: { id: true, name: true },
  });

  let refreshed = 0;
  let failed = 0;

  for (const org of orgs) {
    const result = await refreshCUFD(org.id).catch((error) => {
      reportAsyncError("cron.siatCufd.refreshCUFD", error, { organizationId: org.id });
      return { ok: false, error: String(error) };
    });

    if (result.ok) refreshed++;
    else failed++;
  }

  return NextResponse.json({ ok: true, refreshed, failed });
}
