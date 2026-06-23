import { env } from "./env";

/**
 * WhatsApp delivery via the Meta WhatsApp Cloud API.
 *
 * Proactive (business-initiated) messages — like class reminders — MUST use a
 * pre-approved message template. Free text is only allowed inside the 24h
 * customer-service window, which doesn't apply here. So we always send a
 * template message with positional body parameters ({{1}}, {{2}}, ...).
 *
 * Configure in .env:
 *   WHATSAPP_PHONE_NUMBER_ID   – the phone number ID from the Meta dashboard
 *   WHATSAPP_ACCESS_TOKEN      – a permanent system-user access token
 *   WHATSAPP_REMINDER_TEMPLATE – approved template name (default "class_reminder")
 *   WHATSAPP_TEMPLATE_LANG     – template language code (default "en")
 */

export function isWhatsAppConfigured(): boolean {
  const e = env();
  return Boolean(e.WHATSAPP_PHONE_NUMBER_ID && e.WHATSAPP_ACCESS_TOKEN);
}

/**
 * Normalises a phone number to the digits-only international form Meta expects
 * (country code + number, no "+", spaces or punctuation). If the number has no
 * country code and WHATSAPP_DEFAULT_COUNTRY_CODE is set, it is prepended.
 */
export function normalizeWhatsAppNumber(raw: string): string | null {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/\D/g, "");
  if (!digits) return null;
  const cc = env().WHATSAPP_DEFAULT_COUNTRY_CODE?.replace(/\D/g, "");
  if (cc && digits.length <= 10 && !digits.startsWith(cc)) {
    digits = `${cc}${digits.replace(/^0+/, "")}`;
  }
  return digits.length >= 8 ? digits : null;
}

export interface WhatsAppTemplateMessage {
  to: string;
  /** Defaults to WHATSAPP_REMINDER_TEMPLATE. */
  templateName?: string;
  /** Defaults to WHATSAPP_TEMPLATE_LANG. */
  languageCode?: string;
  /** Positional body parameters, mapped to {{1}}, {{2}}, ... in the template. */
  bodyParams: string[];
}

export async function sendWhatsAppTemplate(
  msg: WhatsAppTemplateMessage,
): Promise<boolean> {
  const e = env();
  if (!isWhatsAppConfigured()) {
    console.warn("[whatsapp] not configured — message skipped.");
    return false;
  }
  const to = normalizeWhatsAppNumber(msg.to);
  if (!to) {
    console.warn("[whatsapp] invalid recipient number — message skipped.");
    return false;
  }

  const url = `https://graph.facebook.com/${e.WHATSAPP_API_VERSION}/${e.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: msg.templateName ?? e.WHATSAPP_REMINDER_TEMPLATE,
      language: { code: msg.languageCode ?? e.WHATSAPP_TEMPLATE_LANG },
      components: [
        {
          type: "body",
          parameters: msg.bodyParams.map((text) => ({ type: "text", text })),
        },
      ],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${e.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[whatsapp] send failed (${res.status}): ${detail}`);
    return false;
  }
  return true;
}
