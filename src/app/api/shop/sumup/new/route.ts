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
import { formatVariantSimple } from "@/utils/shop/shopUtils";
import { getOrderByNumber, updateOrder } from "@/lib/db/repositories/shop.repository";
import { getCheckoutSession, saveCheckoutSession } from "@/lib/redis/sessions";
import { verifyPermission } from "@/lib/auth";
import { handleApiError } from "@/utils/apiErrorUtils";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;
const CHECKOUT_TTL_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyPermission("orders:create");
    if (auth.error) return auth.error;

    let orderNumber = "";
    try {
      const body = (await req.json()) as CreateCheckoutRequestBody & { orderId?: string | number };
      orderNumber = String(body?.orderNumber ?? body?.orderId ?? "").trim();
      if (!orderNumber) return sumupErrorResponse("Missing orderNumber", 400);
    } catch {
      return sumupErrorResponse("Invalid request body", 400);
    }

    const credentialError = validateSumUpCredentials();
    if (credentialError) return credentialError;

    // Handle Redis in-flight session (e.g. Apple Pay / web checkout hold)
    if (orderNumber) {
      const session = await getCheckoutSession(orderNumber);
      if (session) {
        if (session.user_istid && auth.user && session.user_istid !== auth.user.istid)
          return sumupErrorResponse("Not order owner", 403);

        const amount = Math.round(Number(session.total_amount) * 100) / 100;
        if (amount <= 0) return sumupErrorResponse("Invalid order amount", 400);

        const sessionExpiryMs = session.expires_at
          ? new Date(session.expires_at).getTime()
          : Date.now() + 1800 * 1000;
        const remainingSeconds = Math.floor((sessionExpiryMs - Date.now()) / 1000);

        if (remainingSeconds < 60)
          return sumupErrorResponse(
            "A sessão de pagamento expirou ou está prestes a expirar.",
            400
          );

        // SumUp checkout expires 2 minutes before the Redis hold expires
        const validUntil = new Date(sessionExpiryMs - 120_000).toISOString();
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shop/sumup/callback?orderNumber=${orderNumber}`;
        const description = `Encomenda ${session.order_number}`;

        const payload: SumUpCheckoutPayload = {
          merchant_code: SUMUP_MERCHANT_CODE!,
          amount,
          currency: "EUR" as const,
          checkout_reference: session.order_number,
          description,
          valid_until: validUntil,
          return_url: returnUrl,
          redirect_url: returnUrl,
        };

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
      }
    }

    const order = await getOrderByNumber(orderNumber);
    if (!order) return sumupErrorResponse("Order not found", 404);

    if (order.user_istid && auth.user && order.user_istid !== auth.user.istid)
      return sumupErrorResponse("Not order owner", 403);

    const amount = Math.round(Number(order.total_amount) * 100) / 100;
    if (amount <= 0) return sumupErrorResponse("Invalid order amount", 400);

    const validUntil = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60_000).toISOString();
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shop/sumup/callback?orderNumber=${orderNumber}`;
    const description =
      order.items
        ?.map(
          (item: {
            product_name?: string;
            name?: string;
            quantity?: number;
            variant_label?: string;
            variant_options?: unknown;
          }) => {
            const name = item.product_name || item.name || "Produto";
            const qty = item.quantity || 1;
            const variant = formatVariantSimple(
              item.variant_options as Record<string, string> | undefined,
              item.variant_label
            ).text;
            return `${qty}x ${name}${variant ? " - " + variant : ""}`;
          }
        )
        .join("\n") || `Encomenda ${order.order_number}`;

    const payload: SumUpCheckoutPayload = {
      merchant_code: SUMUP_MERCHANT_CODE!,
      amount,
      currency: "EUR" as const,
      checkout_reference: order.order_number,
      description,
      valid_until: validUntil,
      return_url: returnUrl,
      redirect_url: returnUrl,
    };

    try {
      const checkout = await withSumUp((client) => client.checkouts.create(payload));
      const checkoutId = checkout.id;

      if (!checkoutId) return sumupErrorResponse("Unexpected response from payment service", 502);

      await updateOrder(
        orderNumber,
        {
          payment_reference: checkoutId,
          updated_at: new Date().toISOString(),
        },
        false,
        auth.user?.istid ?? "system"
      ).catch((error) => console.warn("Failed to persist checkoutId on order:", error));

      const response: CreateCheckoutResponse = { checkoutId, amount };
      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof SumUpAuthError) return sumupErrorResponse(error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("DUPLICATED_CHECKOUT")) {
        const latestOrder = await getOrderByNumber(orderNumber);
        const latestCheckoutId =
          typeof latestOrder?.payment_reference === "string"
            ? latestOrder.payment_reference.trim()
            : "";

        if (latestCheckoutId) {
          return NextResponse.json({
            checkoutId: latestCheckoutId,
          } satisfies CreateCheckoutResponse);
        }
      }

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
