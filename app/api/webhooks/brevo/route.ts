import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Brevo webhook events: https://developers.brevo.com/docs/webhooks
const BREVO_EVENTS: Record<string, "DELIVERED" | "BOUNCED" | "BLOCKED" | "SPAM"> = {
  delivered: "DELIVERED",
  bounce: "BOUNCED",
  blocked: "BLOCKED",
  spam: "SPAM",
};

export async function POST(request: Request) {
  const webhookKey = process.env.BREVO_WEBHOOK_KEY;
  if (webhookKey) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token !== webhookKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = Array.isArray(body) ? body : [body];
  let processed = 0;

  for (const event of events) {
    const e = event as {
      email?: string;
      date?: string;
      event?: string;
      "message-id"?: string;
      reason?: string;
      tag?: string;
    };

    const brevoEventType = e.event?.toLowerCase();
    if (!brevoEventType || !BREVO_EVENTS[brevoEventType]) continue;

    const status = BREVO_EVENTS[brevoEventType];
    const messageId = e["message-id"];
    const error = e.reason ?? undefined;

    // Find matching email log by message-id or recipient email
    if (messageId) {
      await prisma.emailLog.updateMany({
        where: { brevoMessageId: messageId },
        data: { status, error },
      }).catch(() => null);
    }

    // Fallback: update by recipient email if no message-id match
    if (e.email) {
      await prisma.emailLog.updateMany({
        where: {
          to: e.email,
          status: "SENT",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        data: { status, error },
      }).catch(() => null);
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
