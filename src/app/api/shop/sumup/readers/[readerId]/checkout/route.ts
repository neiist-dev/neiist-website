import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/payments/sumup";
import type { SumUpReaderCheckoutResponse, SumUpReaderCheckoutPayload } from "@/types/shop/sumup";
import { getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { verifyPermission } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission(["pos:access", "shop:write"], { match: "any" });
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const clientTransactionId = req.nextUrl.searchParams.get("client_transaction_id");
  if (!clientTransactionId) return sumupErrorResponse("client_transaction_id is required", 400);

  try {
    const tx = await withSumUp((client) =>
      client.transactions.get(SUMUP_MERCHANT_CODE!, {
        client_transaction_id: clientTransactionId,
      })
    );

    const status = String(
      (tx as { status?: string; simple_status?: string }).status ||
        (tx as { simple_status?: string }).simple_status ||
        "PENDING"
    ).toUpperCase();
    const id = tx.transaction_code || tx.id || clientTransactionId;

    return NextResponse.json({
      status,
      id,
    });
  } catch {
    // If transaction is not found yet in SumUp, it is still pending on the terminal
    return NextResponse.json({
      status: "PENDING",
      id: clientTransactionId,
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission(["pos:access", "shop:write"], {
    match: "any",
  });
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const { readerId } = await params;
  const body = (await req.json()) as {
    orderId?: number | string;
    amount?: number;
    currency?: string;
    description?: string;
  };

  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  let amount = 0;
  let description = "Venda POS";

  if (body.orderId) {
    const orderIdentifier = String(body.orderId).trim();
    const order = await getOrderByNumber(orderIdentifier);
    if (!order) return sumupErrorResponse("Order not found", 404);
    amount = Number(order.total_amount ?? 0);
    description = `Encomenda ${order.order_number}`;
  } else if (body.amount != null) {
    amount = Number(body.amount);
    if (typeof body.description === "string" && body.description.trim()) {
      description = body.description.trim();
    }
  }

  if (!(amount > 0)) return sumupErrorResponse("Invalid order amount", 400);

  const payload: SumUpReaderCheckoutPayload = {
    description,
    total_amount: {
      currency: "EUR",
      minor_unit: 2,
      value: Math.round(amount * 100),
    },
  };

  let data: SumUpReaderCheckoutResponse;
  try {
    data = await withSumUp((client) =>
      client.readers.createCheckout(SUMUP_MERCHANT_CODE!, readerId, payload)
    );
  } catch (error) {
    return sumupErrorResponse(error, undefined, { readerId });
  }

  const clientTransactionId = data.data?.client_transaction_id ?? null;

  return NextResponse.json({
    success: true,
    clientTransactionId,
    client_transaction_id: clientTransactionId,
    order_number: description,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await verifyPermission(["pos:access", "shop:write"], {
    match: "any",
  });
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const { readerId } = await params;
  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  try {
    await withSumUp((client) => client.readers.terminateCheckout(SUMUP_MERCHANT_CODE!, readerId));
    return NextResponse.json({ success: true });
  } catch (err) {
    return sumupErrorResponse(err);
  }
}
