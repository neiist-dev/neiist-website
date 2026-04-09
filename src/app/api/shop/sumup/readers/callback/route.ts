import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/utils/dbUtils";
import { getSumUpClient, sumupErrorResponse } from "@/utils/sumupUtils";
import type { SumUpCheckout } from "@/types/sumup";
import { finalizePaidOrder } from "@/utils/sumupOrderFinalization";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

type ReaderCheckoutStatusPayload = {
  payload?: {
    client_transaction_id?: string;
    checkout_id?: string;
    status?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReaderCheckoutStatusPayload;
    const orderIdRaw = req.nextUrl.searchParams.get("orderId");
    const orderId = Number(orderIdRaw);

    if (!Number.isInteger(orderId) || orderId <= 0)
      return sumupErrorResponse("Invalid orderId", 400);

    const status = String(body?.payload?.status ?? "").toLowerCase();
    const clientTransactionId = body?.payload?.client_transaction_id;
    const checkoutId = body?.payload?.checkout_id;

    const order = await getOrderById(orderId);

    if (!order) return sumupErrorResponse("Order not found", 404);

    if (["paid", "ready", "delivered"].includes(order.status))
      return NextResponse.json({ success: true, alreadyProcessed: true });

    if (status === "successful") {
      let paymentReference = clientTransactionId ?? checkoutId ?? order.payment_reference;

      if (clientTransactionId && SUMUP_MERCHANT_CODE && process.env.SUMUP_API_KEY) {
        const client = getSumUpClient();
        try {
          const checkoutData = (await client.transactions.get(SUMUP_MERCHANT_CODE!, {
            client_transaction_id: clientTransactionId,
          })) as SumUpCheckout;

          const transactionCode = checkoutData?.transaction_code;
          if (transactionCode) {
            paymentReference = transactionCode;
          }
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
