import { NextRequest, NextResponse } from "next/server";
import {
  validateSumUpCredentials,
  withSumUp,
  sumupErrorResponse,
  SumUpAuthError,
} from "@/lib/payments/sumup";
import type {
  CreateCheckoutResponse,
  CreateCheckoutRequestBody,
  SumUpCheckoutPayload,
} from "@/types/shop/sumup";
import {
  getCheckoutSession,
  getRemainingSessionSeconds,
  getSessionExpiryMs,
  saveCheckoutSession,
} from "@/lib/redis/sessions";
import { verifyPermission } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;
const MIN_REMAINING_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermission("orders:create");
    if (auth.error) return auth.error;

    let orderNumber = "";
    try {
      const body = (await req.json()) as CreateCheckoutRequestBody & {
        orderId?: string | number;
      };
      orderNumber = String(body?.orderNumber ?? body?.orderId ?? "").trim();
      if (!orderNumber) return sumupErrorResponse("Missing orderNumber", 400);
    } catch {
      return sumupErrorResponse("Invalid request body", 400);
    }

    const session = await getCheckoutSession(orderNumber);
    if (!session) {
      return sumupErrorResponse("A sessão de checkout expirou. Volta ao carrinho.", 410);
    }

    if (session.user_istid && auth.user && session.user_istid !== auth.user.istid)
      return sumupErrorResponse("Not order owner", 403);

    const amount = Math.round(Number(session.total_amount) * 100) / 100;
    if (amount <= 0) return sumupErrorResponse("Invalid order amount", 400);

    const sessionExpiryMs = getSessionExpiryMs(session);
    const remainingSeconds = getRemainingSessionSeconds(session);

    if (remainingSeconds < MIN_REMAINING_SECONDS)
      return sumupErrorResponse("A sessão de pagamento expirou ou está prestes a expirar.", 400);

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    if (session.reference) {
      try {
        const existing = await withSumUp((client) => client.checkouts.get(session.reference!));
        if (existing?.status === "PENDING") {
          return NextResponse.json({
            checkoutId: session.reference,
            amount,
          } satisfies CreateCheckoutResponse);
        }
      } catch {
        // If the existing checkout is expired, failed or deleted, create a fresh one below
      }
    }

    const validUntil = new Date(sessionExpiryMs).toISOString();
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shop/sumup/callback?orderNumber=${orderNumber}`;
    const description = `Encomenda ${session.order_number}`;
    const checkoutReference = `${session.order_number}-${Date.now().toString(36)}`;

    const payload: SumUpCheckoutPayload = {
      merchant_code: SUMUP_MERCHANT_CODE!,
      amount,
      currency: "EUR" as const,
      checkout_reference: checkoutReference,
      description,
      valid_until: validUntil,
      return_url: returnUrl,
      redirect_url: returnUrl,
    };

    try {
      const checkout = await withSumUp((client) => client.checkouts.create(payload));
      const checkoutId = checkout.id;

      if (!checkoutId) return sumupErrorResponse("Unexpected response from payment service", 502);

      await saveCheckoutSession(
        {
          ...session,
          reference: checkoutId,
        },
        Math.max(1, remainingSeconds)
      );

      return NextResponse.json({
        checkoutId,
        amount,
      } satisfies CreateCheckoutResponse);
    } catch (error) {
      if (error instanceof SumUpAuthError) return sumupErrorResponse(error);
      const message = error instanceof Error ? error.message : String(error);

      console.error("Failed to create SumUp checkout", {
        orderNumber,
        message,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return sumupErrorResponse("Failed to create payment session", 500);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
