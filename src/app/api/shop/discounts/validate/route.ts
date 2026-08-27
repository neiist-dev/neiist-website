import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/db/repositories/shop.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { serverCheckRoles } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();

    if (!body.code || !body.cart_items || !Array.isArray(body.cart_items))
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });

    const code = typeof body.code === "string" ? body.code.trim() : "";
    const userIstid = userRoles.user.istid;

    const result = await validateDiscountCode(code, userIstid, body.cart_items);
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
    return handleApiError(error);
  }
}
