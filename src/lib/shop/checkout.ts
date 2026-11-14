import { generateOrderNumber, getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { validateAndPriceCartItems } from "@/lib/shop/pricing";
import { getCheckoutSession } from "@/lib/redis/sessions";
import { hasPermission } from "@/lib/security/permissions";
import {
  type BuildCheckoutSessionOptions,
  CHECKOUT_HOLD_TTL_SECONDS,
  type CheckoutSessionData,
} from "@/types/redis";
import type { Order } from "@/types/shop/order";
import type { PaymentMethod, ResolvePaymentTargetResult } from "@/types/shop/payment";
import type { ProductChannel } from "@/types/shop/product";
import type { User } from "@/types/user";
import { addMoney } from "@/utils/shop/moneyUtils";

/**
 * Redis CheckoutSessionData payload across Web, POS, and Fast-POS channels.
 */
export function buildCheckoutSession(opts: BuildCheckoutSessionOptions): CheckoutSessionData {
  const ttlSeconds = opts.ttlSeconds ?? CHECKOUT_HOLD_TTL_SECONDS;
  const nowMs = Date.now();
  const isFastPos = opts.channel === "fast-pos";
  const isWeb = opts.channel === "web";

  return {
    order_number: opts.orderNumber,
    order_source: opts.channel,
    total_amount: opts.totalAmount,
    payment_method: opts.paymentMethod ?? null,
    items: opts.items.map((it) => ({
      product_id: it.product_id,
      variant_id: it.variant_id ?? null,
      quantity: it.quantity ?? 1,
      deliver_now: isFastPos ? true : isWeb ? false : Boolean(it.deliver_now),
    })),
    user_istid: opts.userIstid,
    customer_name: opts.customerName ?? null,
    customer_email: opts.customerEmail ?? null,
    customer_phone: opts.customerPhone ?? null,
    customer_nif: opts.customerNif ?? null,
    campus: opts.campus ?? null,
    notes: opts.notes ?? null,
    discount_code: opts.discountCode,
    stock_override: opts.stockOverride,
    created_by: opts.createdBy,
    shift_id: opts.shiftId,
    cart_id: opts.cartId ?? undefined,
    created_at: opts.createdAt ?? new Date(nowMs).toISOString(),
    expires_at: opts.expiresAt ?? new Date(nowMs + ttlSeconds * 1000).toISOString(),
  };
}

export async function createPosCheckoutSessionFromCart(params: {
  items: Array<{
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    deliver_now?: boolean;
  }>;
  channel: ProductChannel;
  paymentMethod: PaymentMethod;
  createdBy: string;
  body: Record<string, unknown>;
  ttlSeconds?: number;
}): Promise<{ session: CheckoutSessionData } | { error: string }> {
  const { items, channel, paymentMethod, createdBy, body } = params;
  const isFastPos = channel === "fast-pos";
  const str = (key: string) =>
    typeof body[key] === "string" && (body[key] as string).trim()
      ? (body[key] as string).trim()
      : null;

  const pricing = await validateAndPriceCartItems(items, {
    channel,
    userIstid: !isFastPos ? str("user_istid") : null,
    discountCode: !isFastPos ? str("discount_code") : null,
    enforceChannel: true,
    enforceTicketRules: !isFastPos,
  });
  if (!pricing.isValid) return { error: pricing.error || "Invalid cart items" };

  const orderNumber = await generateOrderNumber();

  return {
    session: buildCheckoutSession({
      orderNumber,
      channel,
      totalAmount: pricing.finalAmount,
      items,
      paymentMethod,
      userIstid: !isFastPos ? (str("user_istid") ?? undefined) : undefined,
      customerName: str("customer_name") || (isFastPos ? "Cliente Balcão Rápido" : "Cliente POS"),
      customerEmail: isFastPos ? null : str("customer_email"),
      customerPhone: isFastPos ? null : str("phone") || str("customer_phone"),
      customerNif: str("customer_nif"),
      campus: str("campus"),
      notes: str("notes"),
      discountCode: !isFastPos ? (str("discount_code") ?? undefined) : undefined,
      stockOverride: body.stock_override === true,
      createdBy,
      shiftId: str("shiftId") || str("shift_id"),
      cartId: str("cart_id") ?? undefined,
      ttlSeconds: params.ttlSeconds ?? 600,
    }),
  };
}

function extractTargetOrderNumbers(body: Record<string, unknown>): string[] {
  if (Array.isArray(body?.orderNumbers))
    return body.orderNumbers.map((s) => String(s).trim()).filter(Boolean);

  const single = body?.orderNumber ?? body?.orderId;
  if (typeof single === "string" && single.trim())
    return single
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  if (typeof single === "number" && Number.isFinite(single)) return [String(single)];

  return [];
}

/**
 * Resolves a payment target from an active Redis checkout session, existing pending
 * PostgreSQL order(s), or new POS / Fast-POS cart items.
 */
export async function resolvePaymentTarget(
  body: Record<string, unknown>,
  user: User | undefined,
  paymentMethod: PaymentMethod
): Promise<ResolvePaymentTargetResult> {
  const orderNumbers = extractTargetOrderNumbers(body);
  const isPosUser = Boolean(user && hasPermission(user, "pos:access"));

  if (orderNumbers.length === 1) {
    const session = await getCheckoutSession(orderNumbers[0]);
    if (session) {
      const canAccess =
        !session.user_istid || (Boolean(user) && (user!.istid === session.user_istid || isPosUser));
      if (!canAccess) return { error: "Sem permissão para esta encomenda.", statusCode: 403 };

      return {
        orderNumber: session.order_number,
        orderNumbers: [session.order_number],
        totalAmount: Number(session.total_amount),
        description: `Encomenda ${session.order_number}`,
        customerEmail: session.customer_email || undefined,
        redisSession: session,
      };
    }
  }

  if (orderNumbers.length > 0) {
    const fetched = await Promise.all(orderNumbers.map((num) => getOrderByNumber(num)));
    if (fetched.some((ord) => ord === null))
      return { error: "Encomenda não encontrada.", statusCode: 404 };

    const orders = fetched as Order[];
    for (const ord of orders) {
      if (ord.status !== "pending")
        return { error: "Apenas encomendas pendentes podem ser pagas.", statusCode: 400 };
      if (!isPosUser && (!user || !ord.user_istid || ord.user_istid !== user.istid))
        return { error: "Sem permissão para esta encomenda.", statusCode: 403 };
    }

    return {
      orderNumber: orders[0].order_number,
      orderNumbers: orders.map((o) => o.order_number),
      totalAmount: orders.reduce((acc, ord) => addMoney(acc, Number(ord.total_amount)), 0),
      description: `Encomenda ${orders[0].order_number}`,
      customerEmail: orders[0]?.customer_email || undefined,
    };
  }

  if (Array.isArray(body?.items) && body.items.length > 0) {
    if (!user) return { error: "Not authenticated", statusCode: 401 };
    if (!isPosUser) return { error: "Insufficient permissions", statusCode: 403 };

    const channel: ProductChannel = body.order_source === "fast-pos" ? "fast-pos" : "pos";
    const result = await createPosCheckoutSessionFromCart({
      items: body.items as Parameters<typeof createPosCheckoutSessionFromCart>[0]["items"],
      channel,
      paymentMethod,
      createdBy: user.istid,
      body,
    });
    if ("error" in result) return { error: result.error, statusCode: 400 };

    return {
      orderNumber: result.session.order_number,
      orderNumbers: [result.session.order_number],
      totalAmount: result.session.total_amount,
      description: `Encomenda ${result.session.order_number}`,
      customerEmail: result.session.customer_email || undefined,
      redisSession: result.session,
    };
  }

  return { error: "Dados de encomenda ou artigos inválidos.", statusCode: 400 };
}
