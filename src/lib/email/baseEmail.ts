import { getFirstAndLastName } from "@/utils/userUtils";

export interface EmailVariableDefinition {
  key: string;
  label?: string;
  description?: string;
  sampleValue: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Replaces `{{key}}` tokens with matching values from the variables map
 */
export function interpolateEmailVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    let strVal = val != null ? String(val) : "";
    if (key.toLowerCase() === "name") {
      strVal = getFirstAndLastName(strVal) || strVal;
    }
    result = result.replace(regex, strVal);
  }
  return result;
}

export interface BaseEmailLayoutOptions {
  content: string;
  hideFooter?: boolean;
}

/**
 * Common HTML wrapper matching the NEIIST email theme
 */
export function renderBaseEmailLayout({
  content,
  hideFooter = false,
}: BaseEmailLayoutOptions): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const logoUrl = `${baseUrl}/neiist_logo.svg`;

  const footerHtml = hideFooter
    ? ""
    : `
      <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e9ecef;" />
      <p style="font-size: 0.9rem; color: #6c757d; margin: 0;">NEIIST &mdash; Núcleo Estudantil de Informática do IST</p>
    `;

  return `
    <div style="font-family: 'Secular One', Arial, sans-serif; background: #F2F2F7; padding: 2rem; border-radius: 1rem; color: #333; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
      <img src="${logoUrl}" alt="NEIIST Logo" style="height: 48px; margin-bottom: 1.5rem; display: block;" />
      <div style="font-size: 1.05rem; line-height: 1.6;">
        ${content}
      </div>
      ${footerHtml}
    </div>
  `;
}

/**
 * Renders Markdown text into styled HTML matching the NEIIST email theme
 */
export function renderEmailMarkdownToHtml(
  content: string,
  variables?: Record<string, string | number | undefined | null>
): string {
  let processed = variables ? interpolateEmailVariables(content, variables) : content;

  processed = escapeHtml(processed);
  processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
  processed = processed.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" style="color: #2863FD; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  processed = processed.replace(
    /(^|[^"'])(https?:\/\/[^\s<]+)/g,
    '$1<a href="$2" style="color: #2863FD; text-decoration: underline;" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  processed = processed.replace(/\n/g, "<br />");

  return renderBaseEmailLayout({ content: processed });
}
