import { NextRequest, NextResponse } from "next/server";
import { validateSumUpCredentials, withSumUp, sumupErrorResponse } from "@/lib/payments/sumup";
import type { SumUpReaderCheckoutResponse, SumUpReaderCheckoutPayload } from "@/types/shop/sumup";
import { verifyPermission } from "@/lib/auth";
import { resolvePaymentTarget } from "@/lib/shop/checkout";
import { saveCheckoutSession } from "@/lib/redis/sessions";

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
  const body = (await req.json()) as Record<string, unknown>;

  if (!readerId) return sumupErrorResponse("readerId is required", 400);

  const target = await resolvePaymentTarget(body, auth.user, "sumup-tpa");
  if ("error" in target) return sumupErrorResponse(target.error, target.statusCode);
  const { orderNumber, totalAmount, description, redisSession } = target;

  if (!(totalAmount > 0)) return sumupErrorResponse("Invalid order amount", 400);

  const payload: SumUpReaderCheckoutPayload = {
    description,
    total_amount: {
      currency: "EUR",
      minor_unit: 2,
      value: Math.round(totalAmount * 100),
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

  if (redisSession)
    await saveCheckoutSession(
      { ...redisSession, reference: clientTransactionId ?? undefined },
      600
    );

  return NextResponse.json({
    success: true,
    clientTransactionId,
    client_transaction_id: clientTransactionId,
    order_number: orderNumber,
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
