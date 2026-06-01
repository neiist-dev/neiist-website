import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/utils/dbUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const userIstid = typeof body.user_istid === "string" ? body.user_istid.trim() : null;
    const cartItems = Array.isArray(body.cart_items) ? body.cart_items : [];

    const result = await validateDiscountCode(code, userIstid, cartItems);
    if (!result) {
      return NextResponse.json(
        { valid: false, error: "Failed to validate discount code" },
        { status: 500 }
      );
    }

    if (!result.is_valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error ?? "Código de desconto inválido",
          code: result.discount_code ?? code,
          discount_amount: result.discount_amount ?? 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: result.discount_code,
      discount_code_id: result.discount_code_id,
      discount_type: result.discount_type,
      discount_value: result.discount_value,
      discount_amount: result.discount_amount,
    });
  } catch (error) {
    console.error("discounts validate POST error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
