import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { validateSumUpCredentials, getSumUpClient, sumupErrorResponse } from "@/utils/sumupUtils";
import type {
  CreateCheckoutResponse,
  CreateCheckoutRequestBody,
  SumUpCheckoutPayload,
} from "@/types/sumup";
import { formatVariantLabel } from "@/utils/emailUtils";

const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;
const CHECKOUT_TTL_MINUTES = 15;

export async function POST(req: NextRequest) {
  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  let orderId: number;
  try {
    const body = (await req.json()) as CreateCheckoutRequestBody;
    orderId = Number(body?.orderId);

    if (!orderId || orderId <= 0) return sumupErrorResponse("Missing or invalid orderId", 400);
  } catch {
    return sumupErrorResponse("Invalid request body", 400);
  }

  const credentialError = validateSumUpCredentials();
  if (credentialError) return credentialError;

  const client = getSumUpClient();

  const order = await getOrderById(orderId);
  if (!order) return sumupErrorResponse("Order not found", 404);

  if (order.user_istid && auth.user && order.user_istid !== auth.user.istid)
    return sumupErrorResponse("Not order owner", 403);

  const amount = Math.round(Number(order.total_amount) * 100) / 100;
  if (amount <= 0) return sumupErrorResponse("Invalid order amount", 400);

  const validUntil = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60_000).toISOString();
  const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/shop/sumup/callback?orderId=${orderId}`;
  let description =
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
          const variant = formatVariantLabel(
            item.variant_label,
            item.variant_options as Record<string, string> | undefined
          );
          return `${qty}x ${name}${variant ? " - " + variant : ""}`;
        }
      )
      .join("\n") || `Encomenda ${order.order_number || orderId}`;

  const payload: SumUpCheckoutPayload = {
    merchant_code: SUMUP_MERCHANT_CODE!,
    amount,
    currency: "EUR" as const,
    checkout_reference: order.order_number,
    description,
    valid_until: validUntil,
    return_url: returnUrl,
  };

  try {
    const checkout = await client.checkouts.create(payload);
    const checkoutId = checkout.id;

    if (!checkoutId) return sumupErrorResponse("Unexpected response from payment service", 502);

    await updateOrder(orderId, {
      payment_reference: checkoutId,
      updated_at: new Date().toISOString(),
    }).catch((error) => console.warn("Failed to persist checkoutId on order:", error));

    const response: CreateCheckoutResponse = { checkoutId };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("DUPLICATED_CHECKOUT")) {
      const latestOrder = await getOrderById(orderId);
      const latestCheckoutId =
        typeof latestOrder?.payment_reference === "string"
          ? latestOrder.payment_reference.trim()
          : "";

      if (latestCheckoutId) {
        return NextResponse.json({ checkoutId: latestCheckoutId } satisfies CreateCheckoutResponse);
      }
    }

    console.error("Failed to create SumUp checkout", {
      orderId,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return sumupErrorResponse("Failed to create payment session", 500);
  }
}
