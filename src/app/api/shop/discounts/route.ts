import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import {
  createDiscountCode,
  deleteDiscountCode,
  getAllDiscountCodes,
  updateDiscountCode,
} from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getDiscountCampaignEmailTemplate } from "@/utils/emailUtils";
import type {
  DiscountCodeInput,
  DiscountCodeUpdateInput,
  DiscountBulkGenerateInput,
} from "@/types/shop/discountCode";

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeList(value: unknown): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function normalizeProductIds(value: unknown): number[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return null;
  const ids = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
  return ids.length > 0 ? ids : [];
}

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code.length > 0 ? code : null;
}

function normalizeRecipients(value: unknown): DiscountBulkGenerateInput["recipients"] | null {
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

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createCodeForRecipient(
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

export async function GET() {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const codes = await getAllDiscountCodes();
  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();
    const recipients = normalizeRecipients(body.recipients);
    const discountType = body.discount_type;
    const discountValue = Number(body.discount_value);
    const validProductIds = normalizeProductIds(body.valid_product_ids) ?? null;
    const maxUses =
      body.max_uses === undefined || body.max_uses === null || body.max_uses === ""
        ? 1
        : Number(body.max_uses);
    const expiresAt = normalizeString(body.expires_at);
    const emailSubject = normalizeString(body.email_subject);
    const emailIntroLine = normalizeString(body.email_intro_line ?? body.email_markdown);

    if (!recipients) {
      return NextResponse.json(
        { error: "Indica pelo menos um utilizador válido." },
        { status: 400 }
      );
    }
    if (discountType !== "percentage" && discountType !== "fixed") {
      return NextResponse.json({ error: "Tipo de desconto inválido" }, { status: 400 });
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      return NextResponse.json({ error: "Valor de desconto inválido" }, { status: 400 });
    }
    if (!Number.isInteger(maxUses) || maxUses <= 0) {
      return NextResponse.json(
        { error: "O número máximo de usos deve ser positivo." },
        { status: 400 }
      );
    }
    if (!emailSubject || !emailIntroLine) {
      return NextResponse.json(
        { error: "O assunto e o texto do email são obrigatórios." },
        { status: 400 }
      );
    }

    const createdCodes = [] as NonNullable<Awaited<ReturnType<typeof createDiscountCode>>>[];
    const failedRecipients: Array<{ istid: string; error: string }> = [];
    let sentCount = 0;

    for (const recipient of recipients) {
      const created = await createCodeForRecipient(recipient, {
        discount_type: discountType,
        discount_value: discountValue,
        valid_product_ids: validProductIds,
        max_uses: maxUses,
        expires_at: expiresAt,
        active: body.active !== undefined ? Boolean(body.active) : true,
      });

      if (!created) {
        failedRecipients.push({
          istid: recipient.istid,
          error: "Não foi possível gerar o código.",
        });
        continue;
      }

      createdCodes.push(created);

      const sent = await sendEmail({
        to: recipient.email,
        subject: emailSubject,
        html: getDiscountCampaignEmailTemplate(emailIntroLine, {
          recipientName: recipient.name,
          recipientIstid: recipient.istid,
          recipientEmail: recipient.email,
          code: created.code,
          discountType,
          discountValue,
          expiresAt,
          introLine: emailIntroLine,
        }),
      });

      if (sent) {
        sentCount += 1;
      } else {
        failedRecipients.push({
          istid: recipient.istid,
          error: "Código gerado, mas o email não foi enviado.",
        });
      }
    }

    return NextResponse.json(
      {
        codes: createdCodes,
        sent_count: sentCount,
        failed_count: failedRecipients.length,
        failed_recipients: failedRecipients,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("discounts POST error:", error);
    return NextResponse.json({ error: "Failed to generate discount codes" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();
    const discountCodeId = Number(body.id ?? body.discount_code_id);

    if (!Number.isInteger(discountCodeId) || discountCodeId <= 0) {
      return NextResponse.json({ error: "Código de desconto inválido" }, { status: 400 });
    }

    const updates: DiscountCodeUpdateInput = {};
    if (body.code !== undefined) {
      const code = normalizeCode(body.code);
      if (!code) return NextResponse.json({ error: "Código inválido" }, { status: 400 });
      updates.code = code;
    }
    if (body.discount_type !== undefined) {
      if (body.discount_type !== "percentage" && body.discount_type !== "fixed") {
        return NextResponse.json({ error: "Tipo de desconto inválido" }, { status: 400 });
      }
      updates.discount_type = body.discount_type;
    }
    if (body.discount_value !== undefined) {
      const value = Number(body.discount_value);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json({ error: "Valor de desconto inválido" }, { status: 400 });
      }
      updates.discount_value = value;
    }
    if (body.valid_product_ids !== undefined) {
      updates.valid_product_ids = normalizeProductIds(body.valid_product_ids) ?? null;
    }
    if (body.valid_istids !== undefined) {
      updates.valid_istids = normalizeList(body.valid_istids) ?? null;
    }
    if (body.max_uses !== undefined) {
      updates.max_uses =
        body.max_uses === null || body.max_uses === ""
          ? null
          : (() => {
              const value = Number(body.max_uses);
              return Number.isInteger(value) && value > 0 ? value : null;
            })();
    }
    if (body.expires_at !== undefined) {
      updates.expires_at = body.expires_at ? String(body.expires_at) : null;
    }
    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    const updated = await updateDiscountCode(discountCodeId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update discount code" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("discounts PUT error:", error);
    return NextResponse.json({ error: "Failed to update discount code" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json().catch(() => ({}));
    const discountCodeId = Number(body.id ?? body.discount_code_id);

    if (!Number.isInteger(discountCodeId) || discountCodeId <= 0) {
      return NextResponse.json({ error: "Código de desconto inválido" }, { status: 400 });
    }

    const deleted = await deleteDiscountCode(discountCodeId);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete discount code" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("discounts DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete discount code" }, { status: 500 });
  }
}
