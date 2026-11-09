import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/db/repositories/shop.repository";
import { handleApiError } from "@/utils/apiErrorUtils";
import { verifyPermission } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await verifyPermission(["orders:create", "pos:access"], { match: "any" });
  if (auth.error) return auth.error;

  try {
    const { code: rawCode } = await params;
    const code = decodeURIComponent(rawCode).trim();
    const body = await request.json().catch(() => null);

    if (!code || !body?.cart_items || !Array.isArray(body.cart_items))
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const isPos = hasPermission(auth.user, "pos:access");
    const targetIstid =
      isPos && typeof body.target_istid === "string" && body.target_istid.trim()
        ? body.target_istid.trim()
        : auth.user.istid;

    const result = await validateDiscountCode(code, targetIstid, body.cart_items);
    if (!result)
      return NextResponse.json(
        { valid: false, error: "Failed to validate discount code" },
        { status: 500 }
      );

    if (!result.is_valid)
      return NextResponse.json(
        {
          valid: false,
          error: result.error ?? "Invalid discount code",
          code: result.discount_code ?? code,
          discount_amount: result.discount_amount ?? 0,
        },
        { status: 400 }
      );

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
