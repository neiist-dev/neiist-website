import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/sumup";
import type { ApplePayPaymentToken, VerifyCheckoutRequestBody, SumUpCheckout } from "@/types/sumup";
import { finalizePaidOrder } from "@/utils/shop/orderFinalization";
import { getOrderById } from "@/lib/db/repositories/shop.repository";
import { serverCheckRoles } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(req: NextRequest) {
  try {
    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;

    let checkoutId: string;
    let orderId: number;
    let applePayToken: ApplePayPaymentToken | undefined;
    try {
      const body = (await req.json()) as VerifyCheckoutRequestBody;
      checkoutId = String(body?.checkoutId ?? "").trim();
      orderId = Number(body?.orderId);
      applePayToken = body?.applePayToken;

      if (!checkoutId || !orderId) return sumupErrorResponse("Missing checkoutId or orderId", 400);
    } catch {
      return sumupErrorResponse("Invalid request body", 400);
    }

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    const order = await getOrderById(orderId);
    if (!order) return sumupErrorResponse("Order not found", 404);

    if (order.user_istid && auth.user && order.user_istid !== auth.user.istid)
      return sumupErrorResponse("Not order owner", 403);

    if (["paid", "ready", "delivered"].includes(order.status))
      return NextResponse.json({ ok: true, alreadyProcessed: true });

    if (applePayToken) {
      const amount = Math.round(Number(order.total_amount) * 100) / 100;
      const result = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_type: "apple_pay",
          id: checkoutId,
          amount,
          currency: "EUR",
          apple_pay: { token: applePayToken },
        }),
      });

      if (!result.ok) {
        return sumupErrorResponse("Apple Pay processing failed", result.status);
      }
    }

    let checkout: SumUpCheckout;
    try {
      checkout = await withSumUp((client) => client.checkouts.get(checkoutId));
    } catch (error) {
      return sumupErrorResponse(error);
    }

    const status = String(checkout.status ?? "").toUpperCase();

    if (checkout.id && String(checkout.id) !== checkoutId)
      return sumupErrorResponse("Checkout id mismatch", 400);

    if (checkout.currency && checkout.currency.toUpperCase() !== "EUR")
      return sumupErrorResponse("Payment currency mismatch", 400);

    const expectedAmountCents = Math.round(Number(order.total_amount) * 100);
    const actualAmountCents = Math.round(Number(checkout.amount) * 100);
    if (actualAmountCents !== expectedAmountCents)
      return sumupErrorResponse("Payment amount mismatch", 400);

    if (order.payment_reference && order.payment_reference !== checkoutId)
      return sumupErrorResponse("Payment session does not match order", 400);

    if (status === "FAILED" || status === "EXPIRED") {
      return NextResponse.json({
        failed: true,
        status,
        transactionCode: checkout.transaction_code,
      });
    }

    if (status === "PAID") {
      const transactionCode = checkout.transaction_code;
      if (!transactionCode) {
        return NextResponse.json({ pending: true, status });
      }

      const result = await finalizePaidOrder({
        orderId,
        paymentReference: transactionCode,
        paymentCheckedBy: "sumup-verify",
      });

      if (!result.success) return sumupErrorResponse(result.error, result.statusCode);

      return NextResponse.json({
        ok: true,
        status,
        transactionCode,
        alreadyProcessed: result.alreadyProcessed,
        finalized: !result.alreadyProcessed,
      });
    }

    return NextResponse.json({ pending: true, status });
  } catch (error) {
    return handleApiError(error);
  }
}
