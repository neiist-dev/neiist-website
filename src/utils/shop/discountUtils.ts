export interface DiscountCartItem {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
}

export interface DiscountValidationApiResponse {
  valid: boolean;
  code?: string;
  discount_code_id?: number;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
  discount_amount?: number;
  error?: string;
}

export async function validateDiscount({
  code,
  cartItems,
  targetIstid,
}: {
  code: string;
  cartItems: DiscountCartItem[];
  targetIstid?: string | null;
}): Promise<DiscountValidationApiResponse> {
  const response = await fetch(`/api/shop/discounts/validate/${encodeURIComponent(code)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cart_items: cartItems,
      target_istid: targetIstid || undefined,
    }),
  });

  const data = (await response.json().catch(() => null)) as DiscountValidationApiResponse | null;
  if (!response.ok)
    throw new Error(data?.error || "Não foi possível validar o código de desconto.");

  return data ?? { valid: false, error: "Não foi possível validar o código de desconto." };
}
