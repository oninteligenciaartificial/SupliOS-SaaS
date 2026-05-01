export interface QrCreateInput {
  merchantId: string;
  accountAlias?: string;
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  expiryMinutes: number;
  callbackUrl: string;
}

export type QrCreateResult =
  | { ok: true; externalId: string; qrPayload: string; qrImageUrl?: string }
  | { ok: false; error: string };

export type QrStatusResult =
  | { ok: true; status: "PENDIENTE" | "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO"; paidAt?: string; payerInfo?: Record<string, unknown>; raw?: unknown }
  | { ok: false; error: string };

export interface QrCancelResult {
  ok: boolean;
  error?: string;
}

export interface WebhookEvent {
  externalId: string;
  status: "PAGADO" | "EXPIRADO" | "CANCELADO" | "FALLIDO";
  paidAt?: string;
  payerInfo?: Record<string, unknown>;
  raw: unknown;
}

export interface QrProvider {
  createQr(input: QrCreateInput): Promise<QrCreateResult>;
  getStatus(externalId: string): Promise<QrStatusResult>;
  cancel(externalId: string): Promise<QrCancelResult>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): WebhookEvent | null;
}
