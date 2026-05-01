import { createHmac, timingSafeEqual } from "crypto";
import type { QrProvider, QrCreateInput, QrCreateResult, QrStatusResult, QrCancelResult, WebhookEvent } from "./types";

const BASE_URL = process.env.QR_BOLIVIA_AGGREGATOR_URL ?? "";
const API_KEY  = process.env.QR_BOLIVIA_AGGREGATOR_KEY ?? "";
const WEBHOOK_SECRET = process.env.QR_BOLIVIA_WEBHOOK_SECRET ?? "";

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      ...(init.headers ?? {}),
    },
  });
}

export class AggregatorProvider implements QrProvider {
  async createQr(input: QrCreateInput): Promise<QrCreateResult> {
    const res = await apiFetch("/qr/create", {
      method: "POST",
      body: JSON.stringify({
        merchant_id:    input.merchantId,
        account_alias:  input.accountAlias,
        amount:         input.amount,
        currency:       input.currency,
        reference:      input.orderId,
        description:    input.description,
        expiry_minutes: input.expiryMinutes,
        callback_url:   input.callbackUrl,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Aggregator ${res.status}: ${body}` };
    }
    const data = await res.json() as {
      id: string;
      qr_payload: string;
      qr_image_url?: string;
    };
    return { ok: true, externalId: data.id, qrPayload: data.qr_payload, qrImageUrl: data.qr_image_url };
  }

  async getStatus(externalId: string): Promise<QrStatusResult> {
    const res = await apiFetch(`/qr/${externalId}`, { method: "GET" });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Aggregator ${res.status}: ${body}` };
    }
    const data = await res.json() as {
      status: string;
      paid_at?: string;
      payer?: Record<string, unknown>;
    };
    const statusMap: Record<string, "PENDIENTE" | "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO"> = {
      pending:   "PENDIENTE",
      paid:      "PAGADO",
      expired:   "EXPIRADO",
      cancelled: "CANCELADO",
      failed:    "FALLIDO",
    };
    return {
      ok: true,
      status: statusMap[data.status] ?? "FALLIDO",
      paidAt: data.paid_at,
      payerInfo: data.payer,
      raw: data,
    };
  }

  async cancel(externalId: string): Promise<QrCancelResult> {
    const res = await apiFetch(`/qr/${externalId}/cancel`, { method: "POST" });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Aggregator ${res.status}: ${body}` };
    }
    return { ok: true };
  }

  verifyWebhook(headers: Record<string, string>, rawBody: string): WebhookEvent | null {
    const signature = headers["x-qr-signature"] ?? headers["x-webhook-signature"];
    if (!signature || !WEBHOOK_SECRET) return null;

    const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
    try {
      const sigBuf = Buffer.from(signature, "hex");
      const expBuf = Buffer.from(expected, "hex");
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    } catch {
      return null;
    }

    const payload = JSON.parse(rawBody) as {
      id: string;
      status: string;
      paid_at?: string;
      payer?: Record<string, unknown>;
    };
    const statusMap: Record<string, "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO"> = {
      paid:      "PAGADO",
      expired:   "EXPIRADO",
      cancelled: "CANCELADO",
      failed:    "FALLIDO",
    };
    const mappedStatus = statusMap[payload.status];
    if (!mappedStatus) return null;

    return {
      externalId: payload.id,
      status:     mappedStatus,
      paidAt:     payload.paid_at,
      payerInfo:  payload.payer,
      raw:        payload,
    };
  }
}
