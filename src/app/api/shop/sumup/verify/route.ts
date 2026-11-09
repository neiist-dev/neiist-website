import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  sumupErrorResponse,
  verifyAndSettleSumUpCheckout,
} from "@/lib/payments/sumup";
import type { ApplePayPaymentToken, VerifyCheckoutRequestBody } from "@/types/shop/sumup";
import { verifyPermission } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermission("orders:create");
    if (auth.error) return auth.error;

    let checkoutId = "";
    let orderNumber = "";
    let applePayToken: ApplePayPaymentToken | undefined;

    try {
      const body = (await req.json()) as VerifyCheckoutRequestBody & { orderId?: string | number };
      checkoutId = String(body?.checkoutId ?? "").trim();
      orderNumber = String(body?.orderNumber ?? body?.orderId ?? "").trim();
      applePayToken = body?.applePayToken;

      if (!checkoutId || !orderNumber)
        return sumupErrorResponse("Missing checkoutId or orderNumber", 400);
    } catch {
      return sumupErrorResponse("Invalid request body", 400);
    }

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    const result = await verifyAndSettleSumUpCheckout({
      orderNumber,
      checkoutId,
      applePayToken,
      checkedBy: "sumup-verify",
      userIstid: auth.user?.istid,
    });

    if (!result.success) {
      if ("statusCode" in result) return sumupErrorResponse(result.error, result.statusCode);

      return NextResponse.json({
        failed: true,
        status: result.status,
        transactionCode: result.transactionCode,
      });
    }

    if ("pending" in result) return NextResponse.json({ pending: true, status: result.status });

    return NextResponse.json({
      ok: true,
      status: result.status,
      transactionCode: result.reference,
      orderNumber: result.orderNumber,
      alreadyProcessed: result.alreadyProcessed,
      finalized: !result.alreadyProcessed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
