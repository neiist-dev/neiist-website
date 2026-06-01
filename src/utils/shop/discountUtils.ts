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
  userIstid,
  cartItems,
}: {
  code: string;
  userIstid?: string | null;
  cartItems: DiscountCartItem[];
}): Promise<DiscountValidationApiResponse> {
  const response = await fetch("/api/shop/discounts/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      user_istid: userIstid ?? null,
      cart_items: cartItems,
    }),
  });

  const data = (await response.json().catch(() => null)) as DiscountValidationApiResponse | null;
  if (!response.ok) {
    throw new Error(data?.error || "Não foi possível validar o código de desconto.");
  }

  return data ?? { valid: false, error: "Não foi possível validar o código de desconto." };
}
