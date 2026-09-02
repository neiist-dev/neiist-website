import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/sumup";
import type { SumUpCheckout } from "@/types/sumup";
import { finalizePaidOrder } from "@/utils/shop/orderFinalization";
import { getOrderById } from "@/lib/db/repositories/shop.repository";

type CheckoutStatusChangedPayload = {
  event_type?: string;
  id?: string;
};

export async function GET(req: NextRequest) {
  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  const checkoutId = String(req.nextUrl.searchParams.get("checkout_id") ?? "").trim();

  if (!Number.isInteger(orderId) || orderId <= 0) return sumupErrorResponse("Invalid orderId", 400);
  if (!checkoutId) return sumupErrorResponse("Missing checkout_id", 400);

  let checkout: SumUpCheckout;
  try {
    checkout = await withSumUp((client) => client.checkouts.get(checkoutId));
  } catch (err) {
    return sumupErrorResponse(err);
  }

  const order = await getOrderById(orderId);
  if (!order) return sumupErrorResponse("Order not found", 404);

  const status = String(checkout.status ?? "")
    .trim()
    .toUpperCase();

  const expectedAmountCents = Math.round(Number(order.total_amount) * 100);
  const actualAmountCents = Math.round(Number(checkout.amount) * 100);

  if (
    status === "PAID" &&
    actualAmountCents === expectedAmountCents &&
    (!checkout.currency || checkout.currency.toUpperCase() === "EUR")
  ) {
    const transactionCode = String(checkout.transaction_code ?? checkoutId).trim();
    if (transactionCode) {
      await finalizePaidOrder({
        orderId,
        paymentReference: transactionCode,
        paymentCheckedBy: "sumup-return",
      });
    }
  }

  const html = `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pagamento SumUp</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 24px; color: #111827; }
      p { margin: 0; line-height: 1.5; }
    </style>
  </head>
  <body>
    <p>Autenticação concluída. Podes fechar esta janela.</p>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  if (!Number.isInteger(orderId) || orderId <= 0) return sumupErrorResponse("Invalid orderId", 400);

  let body: CheckoutStatusChangedPayload;
  try {
    body = (await req.json()) as CheckoutStatusChangedPayload;
  } catch {
    return sumupErrorResponse("Invalid webhook payload", 400);
  }

  const checkoutId = String(body?.id ?? "").trim();
  if (!checkoutId) return sumupErrorResponse("Missing checkout id", 400);

  let checkout: SumUpCheckout;
  try {
    checkout = await withSumUp((client) => client.checkouts.get(checkoutId));
  } catch (err) {
    return sumupErrorResponse(err);
  }

  const order = await getOrderById(orderId);
  if (!order) return sumupErrorResponse("Order not found", 404);

  if (["paid", "ready", "delivered"].includes(order.status))
    return NextResponse.json({ success: true, alreadyProcessed: true });

  if (order.payment_reference && order.payment_reference !== checkoutId)
    return sumupErrorResponse("Checkout id does not match order", 400);

  if (checkout.currency && checkout.currency.toUpperCase() !== "EUR")
    return sumupErrorResponse("Payment currency mismatch", 400);

  const expectedAmountCents = Math.round(Number(order.total_amount) * 100);
  const actualAmountCents = Math.round(Number(checkout.amount) * 100);
  if (actualAmountCents !== expectedAmountCents)
    return sumupErrorResponse("Payment amount mismatch", 400);

  const status = String(checkout.status ?? "")
    .trim()
    .toUpperCase();

  if (status !== "PAID") return NextResponse.json({ success: true, status });

  const result = await finalizePaidOrder({
    orderId,
    paymentReference: checkout.transaction_code || checkoutId,
    paymentCheckedBy: "sumup-webhook",
  });

  if (!result.success) return sumupErrorResponse(result.error, result.statusCode);

  return NextResponse.json({
    success: true,
    status,
    transactionCode: checkout.transaction_code || undefined,
    alreadyProcessed: result.alreadyProcessed,
  });
}
