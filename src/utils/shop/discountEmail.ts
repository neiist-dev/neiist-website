import type { DiscountType } from "@/types/shop/discountCode";
import { getFirstAndLastName } from "../userUtils";

export interface DiscountEmailTemplateData {
  recipientName?: string;
  recipientIstid?: string;
  recipientEmail?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt?: string | null;
  introLine: string;
}

export function formatDiscountValueLabel(
  discountType: DiscountType,
  discountValue: number
): string {
  if (discountType === "percentage") {
    return `${discountValue}%`;
  }

  return `€${discountValue.toFixed(2)}`;
}

export function formatDiscountExpiryLabel(expiresAt?: string | null): string {
  if (!expiresAt) return "sem limite";

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "sem limite";

  return date.toLocaleDateString("pt-PT");
}

export function interpolateDiscountEmailMarkdown(
  template: string,
  data: DiscountEmailTemplateData
): string {
  const discountLabel = formatDiscountValueLabel(data.discountType, data.discountValue);
  const expiryLabel = formatDiscountExpiryLabel(data.expiresAt);

  return template
    .replace(/\{\{\s*name\s*\}\}/gi, getFirstAndLastName(data.recipientName ?? "") || "")
    .replace(/\{\{\s*istid\s*\}\}/gi, data.recipientIstid || "")
    .replace(/\{\{\s*email\s*\}\}/gi, data.recipientEmail ?? "")
    .replace(/\{\{\s*code\s*\}\}/gi, data.code)
    .replace(/\{\{\s*discount\s*\}\}/gi, discountLabel)
    .replace(/\{\{\s*discount_value\s*\}\}/gi, String(data.discountValue))
    .replace(/\{\{\s*expiry\s*\}\}/gi, expiryLabel);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function interpolateDiscountEmailHtml(
  template: string,
  data: DiscountEmailTemplateData
): string {
  const discountLabel = formatDiscountValueLabel(data.discountType, data.discountValue);
  const expiryLabel = formatDiscountExpiryLabel(data.expiresAt);

  return template
    .replace(
      /\{\{\s*name\s*\}\}/gi,
      escapeHtml(getFirstAndLastName(data.recipientName ?? "") || "")
    )
    .replace(/\{\{\s*istid\s*\}\}/gi, escapeHtml(data.recipientIstid || ""))
    .replace(/\{\{\s*email\s*\}\}/gi, escapeHtml(data.recipientEmail ?? ""))
    .replace(/\{\{\s*code\s*\}\}/gi, escapeHtml(data.code))
    .replace(/\{\{\s*discount\s*\}\}/gi, escapeHtml(discountLabel))
    .replace(/\{\{\s*discount_value\s*\}\}/gi, escapeHtml(String(data.discountValue)))
    .replace(/\{\{\s*expiry\s*\}\}/gi, escapeHtml(expiryLabel))
    .replace(/\{\{\s*intro_line\s*\}\}/gi, escapeHtml(data.introLine));
}

export function getDefaultDiscountEmailIntroLine(): string {
  return `
Olá {{name}}!

Foi gerado um código personalizado para ti, no valor de {{discount}}.

Código: **{{code}}**
Expira: {{expiry}}
  `;
}

export function renderDiscountCampaignEmailHtml(
  templateContent: string,
  data: DiscountEmailTemplateData
): string {
  const discountLabel = formatDiscountValueLabel(data.discountType, data.discountValue);
  const expiryLabel = formatDiscountExpiryLabel(data.expiresAt);

  let processed = templateContent
    .replace(/\{\{\s*name\s*\}\}/gi, getFirstAndLastName(data.recipientName ?? "") || "")
    .replace(/\{\{\s*istid\s*\}\}/gi, data.recipientIstid || "")
    .replace(/\{\{\s*email\s*\}\}/gi, data.recipientEmail ?? "")
    .replace(/\{\{\s*code\s*\}\}/gi, data.code)
    .replace(/\{\{\s*discount\s*\}\}/gi, discountLabel)
    .replace(/\{\{\s*discount_value\s*\}\}/gi, String(data.discountValue))
    .replace(/\{\{\s*expiry\s*\}\}/gi, expiryLabel);

  processed = escapeHtml(processed);

  processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" style="color: #2863FD; text-decoration: underline;">$1</a>'
  );
  processed = processed.replace(
    /(^|[^"'])(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" style="color: #2863FD; text-decoration: underline;">$2</a>'
  );
  processed = processed.replace(/\n/g, "<br />");

  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/neiist_logo.svg`;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333; max-width: 600px;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1.5rem;" />
      <div style="font-size: 1.05rem; line-height: 1.6;">
        ${processed}
      </div>
    </div>
  `;
}
