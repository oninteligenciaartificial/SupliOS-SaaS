import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/whatsapp";

// Meta verifies the webhook endpoint with a GET challenge
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try { payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "JSON invalido" }, { status: 400 }); }

  const data = payload as Record<string, unknown>;

  // Only process whatsapp_business_account events
  if (data.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true });
  }

  const entries = (data.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const changes = (e.changes as unknown[]) ?? [];

    for (const change of changes) {
      const c = change as Record<string, unknown>;
      const value = c.value as Record<string, unknown>;

      if (!value) continue;

      const messages = (value.messages as unknown[]) ?? [];
      const phoneNumberId = value.metadata
        ? (value.metadata as Record<string, unknown>).phone_number_id as string
        : "";

      for (const msg of messages) {
        const m = msg as Record<string, unknown>;
        const from = m.from as string;
        const waId = m.id as string;

        // Find org by phoneNumberId stored in OrgAddon — correct multi-tenant routing
        const addonRecord = phoneNumberId
          ? await prisma.orgAddon.findFirst({
              where: { addon: "WHATSAPP", active: true, phoneNumberId },
              select: { organizationId: true },
            })
          : null;

        if (!addonRecord) continue;

        const orgId = addonRecord.organizationId;

        // Upsert conversation — track 24h window
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await prisma.waConversation.findFirst({
          where: {
            organizationId: orgId,
            phone: from,
            openedAt: { gte: twentyFourHoursAgo },
            closedAt: null,
          },
        });

        if (existing) {
          await prisma.waConversation.update({
            where: { id: existing.id },
            data: { messageCount: { increment: 1 }, waId },
          });
        } else {
          await prisma.waConversation.create({
            data: {
              organizationId: orgId,
              phone: from,
              waId,
              type: "user_initiated",
              messageCount: 1,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
