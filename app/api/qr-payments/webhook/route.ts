import { NextResponse } from "next/server";
import { getProvider } from "@/lib/qr-providers";
import { handleWebhookEvent } from "@/lib/qr-bolivia";
import { reportAsyncError } from "@/lib/monitoring";

// POST /api/qr-payments/webhook — callback del PSP
// Always reads raw body BEFORE parsing, required for HMAC verification.
export async function POST(request: Request) {
  const rawBody = await request.text();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  const provider = getProvider("AGGREGATOR");
  const event = provider.verifyWebhook(headers, rawBody);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  handleWebhookEvent(event).catch((err) =>
    reportAsyncError("qrPayments.webhook.handleEvent", err, { externalId: event.externalId })
  );

  // PSPs expect 200 immediately; processing is fire-and-forget
  return NextResponse.json({ ok: true });
}
