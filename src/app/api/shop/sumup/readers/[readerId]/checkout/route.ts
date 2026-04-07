import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import {
  validateSumUpCredentials,
  getSumUpClient,
  sumupErrorResponse,
  getErrorStatus,
} from "@/utils/sumupUtils";
import { UserRole } from "@/types/user";
import type { SumUpReaderCheckoutResponse, SumUpReaderCheckoutPayload } from "@/types/sumup";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

function toMinorUnits(amountMajor: number, minorUnit = 2): number {
  return Math.round(amountMajor * 10 ** minorUnit);
}

async function authorize() {
  const auth = await serverCheckRoles([UserRole._SHOP_MANAGER, UserRole._ADMIN]);
  if (!auth.isAuthorized) return { error: auth.error };

  return { success: true };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const auth = await authorize();
  if (auth.error) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const client = getSumUpClient();

  const { readerId } = await params;
  const body = (await req.json()) as { orderId?: number | string };

  if (!readerId || !body?.orderId)
    return sumupErrorResponse("readerId and orderId are required", 400);

  const orderId = Number(body.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) return sumupErrorResponse("Invalid orderId", 400);

  const order = await getOrderById(orderId);
  if (!order) return sumupErrorResponse("Order not found", 404);

  const amount = Number(order.total_amount ?? 0);
  if (!(amount > 0)) return sumupErrorResponse("Invalid order amount", 400);

  const payload: SumUpReaderCheckoutPayload = {
    description: order.order_number,
    total_amount: {
      currency: "EUR",
      minor_unit: 2,
      value: toMinorUnits(amount, 2),
    },
  };

  let data: SumUpReaderCheckoutResponse | null = null;
  try {
    data = await client.readers.createCheckout(SUMUP_MERCHANT_CODE!, readerId, payload);
  } catch (error: unknown) {
    return sumupErrorResponse("Failed to create reader checkout", getErrorStatus(error), {
      readerId,
      orderId,
    });
  }

  const clientTransactionId = data?.data?.client_transaction_id ?? null;

  if (clientTransactionId) {
    await updateOrder(orderId, {
      payment_reference: clientTransactionId,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    clientTransactionId: clientTransactionId ?? null,
    orderId,
  });
}
