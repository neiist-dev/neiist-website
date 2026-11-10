import { NextResponse } from "next/server";
import SumUp from "@sumup/sdk";
import type { ApplePayPaymentToken, SumUpCheckout } from "@/types/shop/sumup";
import { getCheckoutSession } from "@/lib/redis/sessions";
import { getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { finalizePaidOrder, promoteRedisCheckoutSession } from "@/utils/shop/orderFinalization";

export class SumUpAuthError extends Error {
  constructor(message = "SumUp API key is invalid or expired") {
    super(message);
    this.name = "SumUpAuthError";
  }
}

const globalForSumUp = globalThis as unknown as {
  sumupClient: SumUp | undefined;
};

/**
 * Validates SumUp environment variables
 */
export function validateSumUpCredentials(): NextResponse | null {
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;

  if (!apiKey || !merchantCode) {
    console.error("Missing SUMUP_API_KEY or SUMUP_MERCHANT_CODE");
    return sumupErrorResponse("Payment service misconfigured", 500);
  }

  return null;
}

/**
 * Returns a SumUp client singleton on globalThis
 */
function getSumUpClient(): SumUp {
  if (!globalForSumUp.sumupClient) {
    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) throw new Error("SUMUP_API_KEY is missing");
    globalForSumUp.sumupClient = new SumUp({ apiKey });
  }
  return globalForSumUp.sumupClient;
}

/**
 * Runs an operation using the SumUp client singleton, returns SumUpAuthError
 */
export async function withSumUp<T>(fn: (_client: SumUp) => Promise<T>): Promise<T> {
  const client = getSumUpClient();
  try {
    return await fn(client);
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 401 || status === 403)
      throw new SumUpAuthError("SumUp API key is invalid or expired");
    throw error;
  }
}

/**
 * Extracts HTTP status code from a SumUp API error object
 */
export function getErrorStatus(err: unknown): number {
  if (!err || typeof err !== "object") return 500;
  const e = err as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;

  const response = e.response as Record<string, unknown> | undefined;
  if (response && typeof response.status === "number") {
    return response.status;
  }

  return 500;
}

export function sumupErrorResponse(
  errOrMessage: unknown,
  status?: number,
  details?: Record<string, unknown>
): NextResponse {
  if (errOrMessage instanceof SumUpAuthError) {
    return NextResponse.json(
      {
        error: errOrMessage.message,
        status: 502,
        ...(details ? { details } : {}),
      },
      { status: 502 }
    );
  }

  const resolvedStatus =
    status ?? (typeof errOrMessage === "string" ? 400 : getErrorStatus(errOrMessage));
  const error =
    typeof errOrMessage === "string"
      ? errOrMessage
      : errOrMessage instanceof Error
        ? errOrMessage.message
        : "SumUp request failed";

  return NextResponse.json(
    { error, status: resolvedStatus, ...(details ? { details } : {}) },
    { status: resolvedStatus }
  );
}

/**
 * Formats an error object for logging/display
 */
export function formatSumUpError(err: unknown): string {
  if (!err) return "Unknown error";

  if (typeof err === "string") return err;

  if (err instanceof Error) return err.message;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Checks transaction status for a SumUp card reader checkout by client_transaction_id.
 */
export async function getReaderTransactionStatus(clientTransactionId: string) {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;
  if (!merchantCode) throw new Error("SUMUP_MERCHANT_CODE is not configured.");

  return withSumUp((client) =>
    client.transactions.get(merchantCode, {
      client_transaction_id: clientTransactionId,
    })
  );
}

export interface VerifyAndSettleSumUpOptions {
  orderNumber: string;
  checkoutId: string;
  applePayToken?: ApplePayPaymentToken;
  checkedBy?: string;
  userIstid?: string | null;
}

export type VerifyAndSettleSumUpResult =
  | {
      success: true;
      status: "PAID";
      reference: string;
      alreadyProcessed: boolean;
      orderNumber: string;
    }
  | { success: true; status: string; pending: true }
  | { success: false; status: "FAILED" | "EXPIRED"; transactionCode?: string }
  | { success: false; error: string; statusCode: number };

type SumUpCheckOutcome =
  | { kind: "paid"; transactionCode?: string }
  | { kind: "pending"; status: string }
  | { kind: "failed"; status: "FAILED" | "EXPIRED"; transactionCode?: string }
  | { kind: "error"; error: string; statusCode: number };

async function authorizeAndCheckSumUpCheckout(params: {
  checkoutId: string;
  expectedAmount: number;
  expectedReference?: string | null;
  applePayToken?: ApplePayPaymentToken;
}): Promise<SumUpCheckOutcome> {
  const { checkoutId, expectedAmount, expectedReference, applePayToken } = params;

  if (applePayToken) {
    const amount = Math.round(expectedAmount * 100) / 100;
    const result = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "apple_pay",
        id: checkoutId,
        amount,
        currency: "EUR",
        apple_pay: { token: applePayToken },
      }),
    });

    if (!result.ok)
      return {
        kind: "error",
        error: "Apple Pay processing failed",
        statusCode: result.status,
      };
  }

  let checkout: SumUpCheckout;
  try {
    checkout = await withSumUp((client) => client.checkouts.get(checkoutId));
  } catch (err) {
    return {
      kind: "error",
      error: err instanceof Error ? err.message : "Failed to retrieve SumUp checkout",
      statusCode: getErrorStatus(err),
    };
  }

  if (checkout.id && String(checkout.id) !== checkoutId)
    return { kind: "error", error: "Checkout id mismatch", statusCode: 400 };

  if (checkout.currency && checkout.currency.toUpperCase() !== "EUR")
    return {
      kind: "error",
      error: "Payment currency mismatch",
      statusCode: 400,
    };

  const expectedAmountCents = Math.round(expectedAmount * 100);
  const actualAmountCents = Math.round(Number(checkout.amount) * 100);
  if (actualAmountCents !== expectedAmountCents)
    return { kind: "error", error: "Payment amount mismatch", statusCode: 400 };

  if (expectedReference && expectedReference !== checkoutId)
    return {
      kind: "error",
      error: "Payment session does not match order",
      statusCode: 400,
    };

  const status = String(checkout.status ?? "")
    .trim()
    .toUpperCase();

  if (status === "FAILED" || status === "EXPIRED")
    return {
      kind: "failed",
      status,
      transactionCode: checkout.transaction_code,
    };

  if (status === "PAID") return { kind: "paid", transactionCode: checkout.transaction_code };

  return { kind: "pending", status };
}

export async function verifyAndSettleSumUpCheckout({
  orderNumber,
  checkoutId,
  applePayToken,
  checkedBy = "sumup",
  userIstid,
}: VerifyAndSettleSumUpOptions): Promise<VerifyAndSettleSumUpResult> {
  const session = await getCheckoutSession(orderNumber);

  if (session) {
    if (session.user_istid && userIstid && session.user_istid !== userIstid)
      return { success: false, error: "Not order owner", statusCode: 403 };

    const outcome = await authorizeAndCheckSumUpCheckout({
      checkoutId,
      expectedAmount: Number(session.total_amount),
      expectedReference: session.reference,
      applePayToken,
    });

    if (outcome.kind === "error")
      return {
        success: false,
        error: outcome.error,
        statusCode: outcome.statusCode,
      };

    if (outcome.kind === "failed")
      return {
        success: false,
        status: outcome.status,
        transactionCode: outcome.transactionCode,
      };

    if (outcome.kind === "pending") return { success: true, status: outcome.status, pending: true };

    const reference = String(outcome.transactionCode || checkoutId).trim();
    const createdOrder = await promoteRedisCheckoutSession(
      session,
      reference,
      applePayToken ? "apple-pay" : undefined
    );
    if (!createdOrder)
      return {
        success: false,
        error: "Failed to promote order to database",
        statusCode: 500,
      };

    return {
      success: true,
      status: "PAID",
      reference,
      alreadyProcessed: false,
      orderNumber: createdOrder.order_number,
    };
  }

  const order = await getOrderByNumber(orderNumber);
  if (!order) return { success: false, error: "Order not found", statusCode: 404 };

  if (order.user_istid && userIstid && order.user_istid !== userIstid)
    return { success: false, error: "Not order owner", statusCode: 403 };

  if (["paid", "ready", "delivered"].includes(order.status))
    return {
      success: true,
      status: "PAID",
      reference: order.payment_reference ?? checkoutId,
      alreadyProcessed: true,
      orderNumber: order.order_number,
    };

  const outcome = await authorizeAndCheckSumUpCheckout({
    checkoutId,
    expectedAmount: Number(order.total_amount),
    expectedReference: order.payment_reference,
    applePayToken,
  });

  if (outcome.kind === "error")
    return {
      success: false,
      error: outcome.error,
      statusCode: outcome.statusCode,
    };

  if (outcome.kind === "failed")
    return {
      success: false,
      status: outcome.status,
      transactionCode: outcome.transactionCode,
    };

  if (outcome.kind === "pending") return { success: true, status: outcome.status, pending: true };

  const reference = String(outcome.transactionCode || checkoutId).trim();
  const result = await finalizePaidOrder({
    orderNumber: order.order_number,
    paymentReference: reference,
    paymentCheckedBy: checkedBy,
    paymentMethod: applePayToken ? "apple-pay" : (order.payment_method ?? "sumup"),
  });

  if (!result.success)
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };

  return {
    success: true,
    status: "PAID",
    reference,
    alreadyProcessed: result.alreadyProcessed ?? false,
    orderNumber: order.order_number,
  };
}
