import type { DiscountType } from "@/types/shop/discountCode";
import { renderEmailMarkdownToHtml } from "@/lib/email/baseEmail";

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
  if (discountType === "percentage") return `${discountValue}%`;

  return `€${discountValue.toFixed(2)}`;
}

export function formatDiscountExpiryLabel(expiresAt?: string | null): string {
  if (!expiresAt) return "sem limite";

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "sem limite";

  return date.toLocaleDateString("pt-PT");
}

export const toDiscountEmailVariables = (data: DiscountEmailTemplateData) => ({
  name: data.recipientName ?? "",
  istid: data.recipientIstid ?? "",
  email: data.recipientEmail ?? "",
  code: data.code,
  discount: formatDiscountValueLabel(data.discountType, data.discountValue),
  discount_value: String(data.discountValue),
  expiry: formatDiscountExpiryLabel(data.expiresAt),
  intro_line: data.introLine,
});

export function getDefaultDiscountEmailIntroLine(): string {
  return `Olá {{name}}!

Foi gerado um código personalizado para ti, no valor de {{discount}}.

Código: **{{code}}**
Expira: {{expiry}}`;
}

export function renderDiscountCampaignEmailHtml(
  templateContent: string,
  data: DiscountEmailTemplateData
): string {
  return renderEmailMarkdownToHtml(templateContent, toDiscountEmailVariables(data));
}

export function getDiscountCampaignEmailTemplate(
  templateContent: string,
  data: DiscountEmailTemplateData
): string {
  return renderDiscountCampaignEmailHtml(templateContent, data);
}
