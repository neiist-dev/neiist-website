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
  const status = body?.event_type;

  if (!Number.isInteger(orderId) || orderId <= 0)
    return sumupErrorResponse("Invalid order_id", 400);

  const clientTransactionId = body?.payload?.client_transaction_id;
  const checkoutId = body?.payload?.checkout_id;

  try {
    const order = await getOrderById(orderId);

    if (!order) return sumupErrorResponse("Order not found", 404);

    if (["paid", "ready", "delivered"].includes(order.status))
      return NextResponse.json({ success: true, alreadyProcessed: true });

    if (status === "successful") {
      let paymentReference = clientTransactionId ?? checkoutId ?? order.payment_reference;

      if (clientTransactionId && SUMUP_MERCHANT_CODE && process.env.SUMUP_API_KEY) {
        try {
          const checkoutData = (await withSumUp((client) =>
            client.transactions.get(SUMUP_MERCHANT_CODE!, {
              client_transaction_id: clientTransactionId,
            })
          )) as SumUpCheckout;

          const transactionCode = checkoutData?.transaction_code;
          if (transactionCode) paymentReference = transactionCode;
        } catch (error) {
          console.warn("Reader callback could not resolve transaction_code", error);
        }
      }

      const result = await finalizePaidOrder({
        orderId,
        paymentReference: String(paymentReference ?? ""),
        paymentCheckedBy: "sumup-tpa",
      });

      if (!result.success) {
        return sumupErrorResponse(result.error, result.statusCode);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reader callback processing error", error);
    return sumupErrorResponse("Failed to process callback", 500);
  }
}
