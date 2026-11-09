import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  sumupErrorResponse,
  verifyAndSettleSumUpCheckout,
} from "@/lib/payments/sumup";

type CheckoutStatusChangedPayload = {
  event_type?: string;
  id?: string;
};

export async function GET(req: NextRequest) {
  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const orderIdentifier = String(
    req.nextUrl.searchParams.get("orderNumber") || req.nextUrl.searchParams.get("orderId") || ""
  ).trim();
  const checkoutId = String(req.nextUrl.searchParams.get("checkout_id") ?? "").trim();

  if (!orderIdentifier) return sumupErrorResponse("Missing orderNumber or orderId", 400);
  if (!checkoutId) return sumupErrorResponse("Missing checkout_id", 400);

  await verifyAndSettleSumUpCheckout({
    orderNumber: orderIdentifier,
    checkoutId,
    checkedBy: "sumup-return",
  });

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

  const orderIdentifier = String(
    req.nextUrl.searchParams.get("orderNumber") || req.nextUrl.searchParams.get("orderId") || ""
  ).trim();
  if (!orderIdentifier) return sumupErrorResponse("Missing orderNumber or orderId", 400);

  let body: CheckoutStatusChangedPayload;
  try {
    body = (await req.json()) as CheckoutStatusChangedPayload;
  } catch {
    return sumupErrorResponse("Invalid webhook payload", 400);
  }

  const checkoutId = String(body?.id ?? "").trim();
  if (!checkoutId) return sumupErrorResponse("Missing checkout id", 400);

  const result = await verifyAndSettleSumUpCheckout({
    orderNumber: orderIdentifier,
    checkoutId,
    checkedBy: "sumup-webhook",
  });

  if (!result.success) {
    if ("statusCode" in result) return sumupErrorResponse(result.error, result.statusCode);

    return NextResponse.json({
      failed: true,
      status: result.status,
      transactionCode: result.transactionCode,
    });
  }

  if ("pending" in result) return NextResponse.json({ success: true, status: result.status });

  return NextResponse.json({
    success: true,
    status: result.status,
    transactionCode: result.reference,
    orderNumber: result.orderNumber,
    alreadyProcessed: result.alreadyProcessed,
  });
}
