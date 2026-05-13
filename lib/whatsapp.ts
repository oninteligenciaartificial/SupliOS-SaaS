import { prisma } from "@/lib/prisma";

const WA_API_URL = `https://graph.facebook.com/v20.0`;

interface SendTextMessageArgs {
  to: string;
  text: string;
  organizationId?: string;
}

interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
  organizationId?: string;
}

async function getPhoneNumberId(organizationId?: string): Promise<{ phoneNumberId: string; accessToken: string } | { error: string }> {
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!accessToken) return { error: "WA_ACCESS_TOKEN no configurado" };

  // If organizationId provided, look up the org's WhatsApp addon for their phone number
  if (organizationId) {
    const addon = await prisma.orgAddon.findFirst({
      where: { organizationId, addon: "WHATSAPP", active: true },
      select: { phoneNumberId: true },
    });
    if (addon?.phoneNumberId) {
      return { phoneNumberId: addon.phoneNumberId, accessToken };
    }
    // Org has WhatsApp addon but no phoneNumberId set — use default
  }

  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  if (!phoneNumberId) return { error: "WA_PHONE_NUMBER_ID no configurado" };

  return { phoneNumberId, accessToken };
}

export async function sendWhatsAppText(args: SendTextMessageArgs): Promise<{ success: boolean; error?: string }> {
  const config = await getPhoneNumberId(args.organizationId);
  if ("error" in config) return { success: false, error: config.error };

  const res = await fetch(`${WA_API_URL}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.to,
      type: "text",
      text: { body: args.text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

export async function sendWhatsAppTemplate(args: SendTemplateMessageArgs): Promise<{ success: boolean; error?: string }> {
  const config = await getPhoneNumberId(args.organizationId);
  if ("error" in config) return { success: false, error: config.error };

  const res = await fetch(`${WA_API_URL}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.to,
      type: "template",
      template: {
        name: args.templateName,
        language: { code: args.languageCode ?? "es_MX" },
        components: args.components ?? [],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: JSON.stringify(err) };
  }

  return { success: true };
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const appSecret = process.env.WA_APP_SECRET;
  if (!appSecret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  return `sha256=${expected}` === signature;
}
