import { NextRequest, NextResponse } from "next/server";
import SumUp from "@sumup/sdk";
import { getAllOrders } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { formatVariantLabel } from "@/utils/emailUtils";
import type { Order } from "@/types/shop";
import { CheckoutPayload, CreateRequestBody, SumUpClient } from "@/types/sumup";

const SUMUP_API_KEY = process.env.SUMUP_API_KEY;
const SUMUP_MERCHANT_CODE = process.env.SUMUP_MERCHANT_CODE;
const RETURN_BASE = process.env.NEXT_PUBLIC_BASE_URL;
const SDK_RETRIES = 3;

function createSumUpClient(): SumUpClient | null {
  if (!SUMUP_API_KEY) return null;
  return new SumUp({ apiKey: SUMUP_API_KEY }) as SumUpClient;
}

function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;
  const resp = e.response as Record<string, unknown> | undefined;
  if (resp && typeof resp.status === "number") return resp.status;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateRequestBody;
    const { orderId, currency = "EUR", checkout_reference } = body ?? {};
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;

    const orders = (await getAllOrders()) as Order[];
    const order = orders.find((o) => o.id === Number(orderId));
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (order.user_istid && auth.user && order.user_istid !== auth.user.istid) {
      return NextResponse.json({ error: "Not order owner" }, { status: 403 });
    }

    const amountMajor = Number(order.total_amount ?? 0);
    if (amountMajor <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!SUMUP_MERCHANT_CODE) {
      return NextResponse.json(
        { error: "Payment service misconfigured: missing SUMUP_MERCHANT_CODE" },
        { status: 500 }
      );
    }

    const client = createSumUpClient();
    if (!client)
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });

    const baseRef = checkout_reference ?? `order-${orderId}`;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < SDK_RETRIES; attempt++) {
      const suffix =
        attempt === 0 ? "" : `-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const uniqueRef = `${baseRef}${suffix}`;

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
          .join("\n") || `Encomenda #${order.order_number || orderId}`;

      const payload: CheckoutPayload & { customer_id?: string } = {
        amount: amountMajor,
        currency,
        checkout_reference: uniqueRef,
        merchant_code: SUMUP_MERCHANT_CODE,
        description,
      };
      if (RETURN_BASE) {
        payload.return_url = `${RETURN_BASE.replace(/\/$/, "")}/my-orders?orderId=${orderId}`;
      }

      try {
        const res = await client.checkouts.create(payload);
        const checkoutId = res?.id ?? res?.data?.id ?? null;
        const hosted_url = res?.hosted_url ?? res?.redirect_url ?? null;

        if (!checkoutId) {
          const details = res ?? null;
          return NextResponse.json(
            { error: "Invalid response from payment service", details },
            { status: 500 }
          );
        }

        return NextResponse.json({
          checkoutId,
          hosted_url,
          checkout_reference: uniqueRef,
          raw: res,
        });
      } catch (err: unknown) {
        lastError = err;
        const status = extractStatus(err);
        if (status === 409) {
          continue;
        }
        break;
      }
    }

    return NextResponse.json(
      { error: "Failed to create payment session", lastError },
      { status: 500 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
