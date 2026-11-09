"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  addDiscountCode,
  deleteDiscountCode,
  updateDiscountCode,
} from "@/lib/db/repositories/shop.repository";
import { sendEmail } from "@/lib/email";
import { getDiscountCampaignEmailTemplate } from "@/lib/email/templates/discounts";
import type {
  DiscountBulkGenerateInput,
  DiscountBulkGenerateResponse,
  DiscountCode,
  DiscountCodeInput,
  DiscountCodeUpdateInput,
} from "@/types/shop/discountCode";

const generateCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function assertValidBulkPayload(payload: DiscountBulkGenerateInput): void {
  if (!Array.isArray(payload.recipients) || payload.recipients.length === 0)
    throw new Error("At least one valid recipient is required.");

  for (const recipient of payload.recipients) {
    if (!recipient || typeof recipient.email !== "string" || !recipient.email.trim())
      throw new Error("Every recipient needs a valid email.");
  }
  if (payload.discount_type !== "percentage" && payload.discount_type !== "fixed")
    throw new Error("Invalid discount type.");

  if (!Number.isFinite(payload.discount_value) || payload.discount_value < 0)
    throw new Error("Invalid discount value.");

  if (payload.max_uses != null && (!Number.isInteger(payload.max_uses) || payload.max_uses <= 0))
    throw new Error("Max uses must be a positive integer.");

  if (
    !payload.email_subject?.trim() ||
    !(payload.email_intro_line || payload.email_markdown || "").trim()
  ) {
    throw new Error("Email subject and body are required.");
  }
}

export async function createDiscountBulkAction(
  payload: DiscountBulkGenerateInput
): Promise<DiscountBulkGenerateResponse> {
  await requirePermission("shop:write");
  assertValidBulkPayload(payload);

  const createdCodes: DiscountCode[] = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of payload.recipients) {
    let created: DiscountCode | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      created = await addDiscountCode({
        code: generateCode(),
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        valid_product_ids: payload.valid_product_ids ?? null,
        valid_istids: recipient.istid ? [recipient.istid] : [],
        max_uses: payload.max_uses ?? 1,
        expires_at: payload.expires_at ?? null,
        active: payload.active ?? true,
      } as DiscountCodeInput);
      if (created) break;
    }

    if (!created) {
      failedCount++;
      continue;
    }

    createdCodes.push(created);

    if (payload.email_subject && (payload.email_intro_line || payload.email_markdown)) {
      const intro = payload.email_intro_line || payload.email_markdown || "";
      const sent = await sendEmail({
        to: recipient.email,
        subject: payload.email_subject,
        html: getDiscountCampaignEmailTemplate(intro, {
          recipientName: recipient.name,
          recipientIstid: recipient.istid,
          recipientEmail: recipient.email,
          code: created.code,
          discountType: payload.discount_type,
          discountValue: payload.discount_value,
          expiresAt: payload.expires_at ?? null,
          introLine: intro,
        }),
      });
      if (sent) sentCount++;
      else failedCount++;
    }
  }

  revalidateTag("discount_codes", "max");
  revalidatePath("/shop/manage/discounts");

  return {
    codes: createdCodes,
    sent_count: sentCount,
    failed_count: failedCount,
  };
}

export async function updateDiscountAction(
  id: number,
  updates: DiscountCodeUpdateInput
): Promise<DiscountCode> {
  await requirePermission("shop:write");

  const updated = await updateDiscountCode(id, updates);
  if (!updated) throw new Error("Falha ao atualizar código de desconto");

  revalidateTag("discount_codes", "max");
  revalidatePath("/shop/manage/discounts");

  return updated;
}

export async function deleteDiscountAction(id: number): Promise<{ success: boolean }> {
  await requirePermission("shop:write");

  const deleted = await deleteDiscountCode(id);
  if (!deleted) throw new Error("Falha ao eliminar código de desconto");

  revalidateTag("discount_codes", "max");
  revalidatePath("/shop/manage/discounts");

  return { success: true };
}
