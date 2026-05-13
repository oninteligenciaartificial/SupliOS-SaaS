import { NextResponse } from "next/server";
import { getTenantProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWhatsAppText } from "@/lib/whatsapp";

const MONTHLY_LIMIT = 300;

export async function GET() {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = profile.organizationId;

  // Verify WHATSAPP addon is active
  const addon = await prisma.orgAddon.findUnique({
    where: { organizationId_addon: { organizationId: orgId, addon: "WHATSAPP" } },
  });
  if (!addon?.active) return NextResponse.json({ error: "Add-on WhatsApp no activo" }, { status: 403 });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [conversations, monthlyCount] = await Promise.all([
    prisma.waConversation.findMany({
      where: { organizationId: orgId, closedAt: null },
      orderBy: { openedAt: "desc" },
      take: 50,
    }),
    prisma.waConversation.count({
      where: { organizationId: orgId, openedAt: { gte: monthStart } },
    }),
  ]);

  return NextResponse.json({
    conversations,
    monthlyCount,
    monthlyLimit: MONTHLY_LIMIT,
    extraCost: monthlyCount > MONTHLY_LIMIT ? ((monthlyCount - MONTHLY_LIMIT) * 0.08).toFixed(2) : "0.00",
  });
}

const sendSchema = z.object({
  phone: z.string().min(7),
  message: z.string().min(1).max(4096),
});

export async function POST(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = profile.organizationId;

  const addon = await prisma.orgAddon.findUnique({
    where: { organizationId_addon: { organizationId: orgId, addon: "WHATSAPP" } },
  });
  if (!addon?.active) return NextResponse.json({ error: "Add-on WhatsApp no activo" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const result = sendSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });

  const { phone, message } = result.data;

  const waResult = await sendWhatsAppText({ to: phone, text: message, organizationId: orgId });
  if (!waResult.success) {
    return NextResponse.json({ error: waResult.error ?? "Error al enviar mensaje" }, { status: 502 });
  }

  // Record the outbound conversation
  await prisma.waConversation.create({
    data: {
      organizationId: orgId,
      phone,
      type: "business_initiated",
      messageCount: 1,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const profile = await getTenantProfile();
  if (!profile) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgId = profile.organizationId;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.waConversation.updateMany({
    where: { id, organizationId: orgId },
    data: { closedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
