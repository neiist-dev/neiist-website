import type {
  DiscountCodeInput,
  DiscountBulkGenerateInput,
} from "@/types/shop/discountCode";
import {
  createDiscountCode,
} from "@/lib/db/repositories/shop.repository";
import { generateCode } from "@/utils/shop/shopUtils";

export function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeList(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

export function normalizeProductIds(value: unknown): number[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  const ids = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
  return ids.length > 0 ? ids : [];
}

export function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code.length > 0 ? code : null;
}

export function normalizeRecipients(value: unknown): DiscountBulkGenerateInput["recipients"] | null {
  if (!Array.isArray(value)) return null;

  const recipients = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const raw = item as Record<string, unknown>;
      const istid = normalizeString(raw.istid) || "";
      const name = normalizeString(raw.name) || "";
      const email = normalizeString(raw.email);
      if (!email) return null;

      return { istid, name, email };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return recipients.length > 0 ? recipients : null;
}

export async function createCodeForRecipient(
  recipient: DiscountBulkGenerateInput["recipients"][number],
  payload: Omit<DiscountBulkGenerateInput, "recipients" | "email_subject" | "email_intro_line">
): Promise<Awaited<ReturnType<typeof createDiscountCode>> | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const created = await createDiscountCode({
      code: generateCode(),
      discount_type: payload.discount_type,
      discount_value: payload.discount_value,
      valid_product_ids: payload.valid_product_ids ?? null,
      valid_istids: recipient.istid ? [recipient.istid] : [],
      max_uses: payload.max_uses ?? 1,
      expires_at: payload.expires_at ?? null,
      active: payload.active ?? true,
    } satisfies DiscountCodeInput);

    if (created) return created;
  }

  return null;
}