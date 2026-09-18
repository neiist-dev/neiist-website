import { NextRequest, NextResponse } from "next/server";
import { withSumUp, sumupErrorResponse } from "@/lib/sumup";
import type { SumUpCheckout, SumUpReaderCallbackPayload } from "@/types/sumup";
import { getOrderById } from "@/lib/db/repositories/shop.repository";
import { finalizePaidOrder } from "@/utils/shop/orderFinalization";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

export async function POST(req: NextRequest) {
  let body: SumUpReaderCallbackPayload;
  try {
    body = (await req.json()) as SumUpReaderCallbackPayload;
  } catch {
    return sumupErrorResponse("Invalid payload", 400);
  }

  const orderId = Number(body?.payload?.order_id);
  const eventType = body?.event_type;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return sumupErrorResponse("Invalid order_id", 400);
  }

  // Early exit for non-successful events
  if (eventType !== "successful") {
    return NextResponse.json({ success: true, ignored: true });
  }

  const clientTransactionId = body?.payload?.client_transaction_id;
  if (!clientTransactionId) {
    return sumupErrorResponse("Missing client_transaction_id", 400);
  }


  if (!SUMUP_MERCHANT_CODE || !process.env.SUMUP_API_KEY) {
    return sumupErrorResponse("Missing SUMUP_MERCHANT_CODE or SUMUP_API_KEY", 500);
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) return sumupErrorResponse("Order not found", 404);

    if (["paid", "ready", "delivered"].includes(order.status)) {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    if (order.payment_reference && order.payment_reference !== clientTransactionId) {
      console.error(
        `Transaction mismatch: Order #${orderId} expects reference '${order.payment_reference}', but callback sent '${clientTransactionId}'`
      );
      return sumupErrorResponse("Transaction ID mismatch for this order", 400);
    }

    // Mandatory SumUp API Verification
    let checkoutData: SumUpCheckout;
    try {
      checkoutData = (await withSumUp((client) =>
        client.transactions.get(SUMUP_MERCHANT_CODE!, {
          client_transaction_id: clientTransactionId,
        })
      )) as SumUpCheckout;
    } catch (error) {
      console.error("Reader callback could not resolve transaction_code", error);
      return sumupErrorResponse("Failed to resolve transaction_code", 500);
    }

    // Strict status check (supports both common SumUp success statuses)
    const isStatusValid =
      checkoutData?.status === "PAID";

    if (!isStatusValid) {
      return sumupErrorResponse("Transaction status is not successful on SumUp", 400);
    }

    // Amount verification
    if (
      checkoutData.amount !== undefined &&
      Number(checkoutData.amount) !== Number(order.total_amount)
    ) {
      console.error(
        `Amount mismatch: Order #${orderId} expects ${order.total_amount}, got ${checkoutData.amount}`
      );
      return sumupErrorResponse("Payment amount mismatch", 400);
    }

    // Resolve payment reference
    const paymentReference =
      checkoutData?.transaction_code ||
      clientTransactionId ||
      order.payment_reference;

    // Finalize Order
    const result = await finalizePaidOrder({
      orderId,
      paymentReference: String(paymentReference ?? ""),
      paymentCheckedBy: "sumup-tpa",
    });

    if (!result.success) {
      return sumupErrorResponse(result.error, result.statusCode);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reader callback processing error", error);
    return sumupErrorResponse("Failed to process callback", 500);
  }
}