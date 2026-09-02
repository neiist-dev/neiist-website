import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  withSumUp,
  sumupErrorResponse,
  getErrorStatus,
} from "@/lib/sumup";
import { UserRole } from "@/types/user";
import type { SumUpCheckout } from "@/types/sumup";
import { serverCheckRoles } from "@/lib/auth";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;

export async function GET(req: NextRequest) {
  const auth = await serverCheckRoles([UserRole._SHOP_MANAGER, UserRole._ADMIN]);
  if (!auth.isAuthorized) return auth.error;

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const clientTransactionId = req.nextUrl.searchParams.get("clientTransactionId");
  if (!clientTransactionId) return sumupErrorResponse("Missing clientTransactionId", 400);

  let checkoutData: SumUpCheckout;
  try {
    checkoutData = (await withSumUp((client) =>
      client.transactions.get(SUMUP_MERCHANT_CODE!, {
        client_transaction_id: clientTransactionId,
      })
    )) as SumUpCheckout;
  } catch (error) {
    if (getErrorStatus(error) === 404) {
      return NextResponse.json({
        success: true,
        status: "pending",
        paid: false,
        transactionCode: null,
      });
    }

    return sumupErrorResponse(error, undefined, {
      transactionId: clientTransactionId,
    });
  }

  const status = String(checkoutData?.status ?? "").toUpperCase();
  const transactionCode = checkoutData?.transaction_code;
  const paid = status === "PAID" || status === "SUCCESSFUL";

  if (paid && !transactionCode) {
    return sumupErrorResponse("Missing transaction code in provider response", 502, {
      transactionId: clientTransactionId,
      status,
    });
  }

  return NextResponse.json({
    success: true,
    status,
    paid,
    transactionCode: transactionCode || null,
    transaction: checkoutData,
  });
}
