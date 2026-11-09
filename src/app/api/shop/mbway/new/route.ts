import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, verifyPermission } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { getCheckoutSession, saveCheckoutSession } from "@/lib/redis/sessions";
import { getOrderByNumber, generateOrderNumber } from "@/lib/db/repositories/shop.repository";
import { requestMbWayPayment, formatMbWayPhone } from "@/lib/payments/ifthenpay";
import { getRedisClient } from "@/lib/redis/client";
import { handleApiError } from "@/utils/apiErrorUtils";
import { validateAndPriceCartItems } from "@/utils/shop/orderFinalization";
import { addMoney } from "@/utils/shop/moneyUtils";
import { MBWAY_STATUS } from "@/types/shop/ifthenpay";
import type { ProductChannel } from "@/types/shop/product";
import type { Order } from "@/types/shop/order";
import type { User } from "@/types/user";
import type { CheckoutSessionData } from "@/types/redis";

interface PaymentTarget {
  orderNumber: string;
  orderNumbers?: string[];
  totalAmount: number;
  customerEmail?: string;
  redisSession?: CheckoutSessionData | null;
}

function extractOrderNumbers(body: Record<string, unknown>): string[] {
  if (Array.isArray(body?.orderNumbers))
    return body.orderNumbers.map((s) => String(s).trim()).filter(Boolean);

  if (typeof body?.orderNumber === "string" && body.orderNumber.trim())
    return body.orderNumber
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return [];
}

async function resolvePaymentTarget(
  body: Record<string, unknown>,
  user: User | undefined
): Promise<{ data?: PaymentTarget; error?: NextResponse }> {
  const orderNumbers = extractOrderNumbers(body);

  // Single order with active Redis checkout session (web checkout hold)
  if (orderNumbers.length === 1) {
    const redisSession = await getCheckoutSession(orderNumbers[0]);
    if (redisSession) {
      const canAccessSession =
        !redisSession.user_istid ||
        (Boolean(user) &&
          (user!.istid === redisSession.user_istid || hasPermission(user!, "pos:access")));

      if (!canAccessSession)
        return {
          error: NextResponse.json(
            { error: "Sem permissão para esta encomenda." },
            { status: 403 }
          ),
        };

      return {
        data: {
          orderNumber: redisSession.order_number,
          totalAmount: Number(redisSession.total_amount),
          customerEmail: redisSession.customer_email || undefined,
          redisSession,
        },
      };
    }
  }

  // Existing database order(s)
  if (orderNumbers.length > 0) {
    const fetchedOrders = await Promise.all(orderNumbers.map((num) => getOrderByNumber(num)));
    if (fetchedOrders.some((ord) => ord === null))
      return {
        error: NextResponse.json({ error: "Encomenda não encontrada." }, { status: 404 }),
      };

    const orders = fetchedOrders as Order[];
    for (const ord of orders) {
      if (ord.status !== "pending") {
        return {
          error: NextResponse.json(
            { error: "Apenas encomendas pendentes podem ser pagas." },
            { status: 400 }
          ),
        };
      }

      const canAccess =
        Boolean(user) &&
        (hasPermission(user!, "pos:access") ||
          (Boolean(ord.user_istid) && ord.user_istid === user?.istid));

      if (!canAccess)
        return {
          error: NextResponse.json(
            { error: "Sem permissão para esta encomenda." },
            { status: 403 }
          ),
        };
    }

    return {
      data: {
        orderNumber: orders[0].order_number,
        orderNumbers: orders.map((o) => o.order_number),
        totalAmount: orders.reduce((acc, ord) => addMoney(acc, Number(ord.total_amount)), 0),
        customerEmail: orders[0]?.customer_email || undefined,
      },
    };
  }

  // Direct POS / Fast-POS items (creating a new order)
  if (Array.isArray(body?.items) && body.items.length > 0) {
    const auth = await verifyPermission("pos:access");
    if (auth.error) return { error: auth.error };

    const channel: ProductChannel = body.order_source === "fast-pos" ? "fast-pos" : "pos";
    const pricing = await validateAndPriceCartItems(
      body.items as Parameters<typeof validateAndPriceCartItems>[0],
      {
        channel,
        userIstid: channel === "pos" ? (body.user_istid as string) || user?.istid || null : null,
        discountCode: channel === "pos" ? ((body.discount_code as string) ?? null) : null,
        enforceChannel: true,
        enforceTicketRules: channel !== "fast-pos",
      }
    );

    if (!pricing.isValid)
      return { error: NextResponse.json({ error: pricing.error }, { status: 400 }) };

    return {
      data: {
        orderNumber: await generateOrderNumber(),
        totalAmount: pricing.finalAmount,
        customerEmail:
          typeof body.customer_email === "string"
            ? body.customer_email.trim() || undefined
            : undefined,
      },
    };
  }

  return {
    error: NextResponse.json(
      { error: "Dados de encomenda ou artigos inválidos." },
      { status: 400 }
    ),
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    const user = session?.user;

    const body = (await req.json()) as Record<string, unknown>;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!phone)
      return NextResponse.json(
        { error: "Número de telemóvel MB WAY obrigatório." },
        { status: 400 }
      );

    const shiftId =
      typeof body?.shiftId === "string"
        ? body.shiftId.trim()
        : typeof body?.shift_id === "string"
          ? body.shift_id.trim()
          : null;

    const target = await resolvePaymentTarget(body, user);
    if (target.error) return target.error;
    const { orderNumber, orderNumbers, totalAmount, customerEmail, redisSession } = target.data!;

    if (!orderNumber || totalAmount <= 0)
      return NextResponse.json(
        { error: "O valor da encomenda deve ser superior a zero." },
        { status: 400 }
      );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    const notificationUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/api/shop/mbway/webhook`
      : undefined;

    const paymentRes = await requestMbWayPayment({
      orderId: orderNumber,
      amount: totalAmount,
      phone,
      email: customerEmail || user?.email || undefined,
      description: `NEIIST ${orderNumber}`,
      notificationUrl,
    });

    if (paymentRes.Status !== MBWAY_STATUS.INIT_SUCCESS)
      return NextResponse.json(
        {
          error: paymentRes.Message || "Não foi possível iniciar o pagamento MB WAY.",
          code: paymentRes.Status,
        },
        { status: 400 }
      );

    if (redisSession) {
      const sessionExpiryMs = redisSession.expires_at
        ? new Date(redisSession.expires_at).getTime()
        : Date.now() + 1800 * 1000;
      const remainingSeconds = Math.max(1, Math.floor((sessionExpiryMs - Date.now()) / 1000));
      await saveCheckoutSession(
        {
          ...redisSession,
          payment_method: "mbway",
          reference: paymentRes.RequestId,
        },
        remainingSeconds
      );
    }

    // Cache request mapping in Redis (TTL = 10 minutes)
    const redisKey = `mbway:req:${paymentRes.RequestId}`;
    const payload = JSON.stringify({
      requestId: paymentRes.RequestId,
      orderNumber,
      orderNumbers,
      shiftId,
      totalAmount,
      phone: formatMbWayPhone(phone),
      status: "pending",
      createdAt: Date.now(),
    });
    await getRedisClient().set(redisKey, payload, "EX", 600);

    return NextResponse.json({
      success: true,
      requestId: paymentRes.RequestId,
      orderNumber,
      amount: totalAmount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
