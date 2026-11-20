import { parseDbNumeric } from "@/utils/shop/moneyUtils";

export type DiscountType = "percentage" | "fixed";

export interface DiscountRecipientInput {
  istid?: string;
  name: string;
  email: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_product_ids: number[];
  valid_istids: string[];
  max_uses?: number | null;
  current_uses: number;
  expires_at?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiscountCodeInput {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_product_ids?: number[] | null;
  valid_istids?: string[] | null;
  max_uses?: number | null;
  expires_at?: string | null;
  active?: boolean;
}

export interface DiscountBulkGenerateInput {
  recipients: DiscountRecipientInput[];
  discount_type: DiscountType;
  discount_value: number;
  valid_product_ids?: number[] | null;
  max_uses?: number | null;
  expires_at?: string | null;
  active?: boolean;
  email_subject: string;
  email_intro_line?: string;
  email_markdown?: string;
}

export interface DiscountBulkGenerateResponse {
  codes: DiscountCode[];
  sent_count: number;
  failed_count: number;
}

export interface DiscountCodeUpdateInput {
  code?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  valid_product_ids?: number[] | null;
  valid_istids?: string[] | null;
  max_uses?: number | null;
  expires_at?: string | null;
  active?: boolean;
}

export interface dbDiscountCode {
  id: number;
  code: string;
  discount_type: string;
  discount_value: string | number;
  valid_product_ids: number[] | null;
  valid_istids: string[] | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountValidationResult {
  is_valid: boolean;
  discount_code_id?: number | null;
  discount_code?: string | null;
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  discount_amount?: number | null;
  error?: string | null;
}

export interface dbDiscountValidationResult {
  is_valid: boolean;
  discount_code_id?: number | null;
  discount_code?: string | null;
  discount_type?: string | null;
  discount_value?: string | number | null;
  discount_amount?: string | number | null;
  error?: string | null;
}

export function mapdbDiscountValidationResult(
  row: dbDiscountValidationResult
): DiscountValidationResult {
  return {
    is_valid: Boolean(row.is_valid),
    discount_code_id: row.discount_code_id ?? null,
    discount_code: row.discount_code ?? null,
    discount_type: (row.discount_type as DiscountType | null) ?? null,
    discount_value:
      row.discount_value !== null && row.discount_value !== undefined
        ? parseDbNumeric(row.discount_value)
        : null,
    discount_amount:
      row.discount_amount !== null && row.discount_amount !== undefined
        ? parseDbNumeric(row.discount_amount)
        : null,
    error: row.error ?? null,
  };
}

export function mapdbDiscountCodeToDiscountCode(row: dbDiscountCode): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type as DiscountType,
    discount_value: parseDbNumeric(row.discount_value),
    valid_product_ids: row.valid_product_ids || [],
    valid_istids: row.valid_istids || [],
    max_uses: row.max_uses,
    current_uses: row.current_uses,
    active: row.active,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
