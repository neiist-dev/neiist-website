import { NextRequest, NextResponse } from "next/server";
import { withSumUp, sumupErrorResponse } from "@/lib/payments/sumup";
import { paymentBroadcaster } from "@/lib/payments/broadcaster";
import type { SumUpReaderCallbackPayload } from "@/types/shop/sumup";
import { getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { getCheckoutSession } from "@/lib/redis/sessions";
import { finalizePaidOrder } from "@/lib/shop/orders";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

function emitReaderStatus(
  status: "PAID" | "FAILED",
  orderNumber: string,
  clientTransactionId?: string
) {
  const payload = { status, orderNumber, clientTransactionId };
  if (clientTransactionId) paymentBroadcaster.emitPaymentUpdate(clientTransactionId, payload);
  paymentBroadcaster.emitPaymentUpdate(orderNumber, payload);
}

export async function POST(req: NextRequest) {
  let body: SumUpReaderCallbackPayload;
  try {
    body = (await req.json()) as SumUpReaderCallbackPayload;
  } catch {
    return sumupErrorResponse("Invalid payload", 400);
  }

  const orderIdentifier = body?.payload?.order_id ? String(body.payload.order_id).trim() : null;
  const status = body?.event_type;
  if (!orderIdentifier) return sumupErrorResponse("Invalid order identifier", 400);

  const clientTransactionId = body?.payload?.client_transaction_id;
  const checkoutId = body?.payload?.checkout_id;

  try {
    const order = await getOrderByNumber(orderIdentifier);
    const redisSession = !order ? await getCheckoutSession(orderIdentifier) : null;
    if (!order && !redisSession) return sumupErrorResponse("Order not found", 404);

    const targetOrderNumber = order ? order.order_number : redisSession!.order_number;

    if (order && ["paid", "ready", "delivered"].includes(order.status)) {
      emitReaderStatus("PAID", targetOrderNumber, clientTransactionId);
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const expectedReference = order ? order.payment_reference : redisSession?.reference;
    if (!clientTransactionId || expectedReference !== clientTransactionId)
      return sumupErrorResponse("Transaction id does not match order", 400);

    if (status === "successful") {
      let paymentReference = clientTransactionId ?? checkoutId ?? expectedReference;

      if (clientTransactionId && SUMUP_MERCHANT_CODE && process.env.SUMUP_API_KEY) {
        try {
          const transaction = await withSumUp((client) =>
            client.transactions.get(SUMUP_MERCHANT_CODE!, {
              client_transaction_id: clientTransactionId,
            })
          );
          if (transaction?.status !== "SUCCESSFUL")
            return sumupErrorResponse("Payment transaction is not successful", 400);
          if (transaction?.transaction_code) paymentReference = transaction.transaction_code;
        } catch (error) {
          console.error("Reader callback could not verify transaction with SumUp", error);
          return sumupErrorResponse("Failed to verify transaction with SumUp", 502);
        }
      }

      const result = await finalizePaidOrder({
        orderNumber: targetOrderNumber,
        paymentReference: String(paymentReference ?? ""),
        paymentCheckedBy: "sumup-tpa",
        paymentMethod: "sumup-tpa",
      });
      if (!result.success) return sumupErrorResponse(result.error, result.statusCode);

      emitReaderStatus("PAID", targetOrderNumber, clientTransactionId);
    } else if (status === "failed" || status === "cancelled") {
      emitReaderStatus("FAILED", targetOrderNumber, clientTransactionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reader callback processing error", error);
    return sumupErrorResponse("Failed to process callback", 500);
  }
}
