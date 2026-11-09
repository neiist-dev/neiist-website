import crypto from "crypto";
import {
  MBWAY_STATUS,
  type MbWayPaymentRequest,
  type MbWayPaymentResponse,
  type MbWayStatusResponse,
} from "@/types/shop/ifthenpay";
import { getRedisClient } from "@/lib/redis/client";
import { paymentBroadcaster } from "@/lib/payments/broadcaster";
import { getCheckoutSession } from "@/lib/redis/sessions";
import { getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { finalizePaidOrders, promoteRedisCheckoutSession } from "@/utils/shop/orderFinalization";

const IFTHENPAY_API_BASE = "https://api.ifthenpay.com/spg/payment";

export function getMbWayKey(): string {
  const key = process.env.IFTHENPAY_MBWAY_KEY;
  if (!key) {
    throw new Error("IFTHENPAY_MBWAY_KEY is not configured.");
  }
  return key.trim();
}

/**
 * Normalizes phone numbers to IfThenPay MB WAY format: COUNTRY_CODE#NUMBER
 */
export function formatMbWayPhone(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("#")) return trimmed;

  const digits = trimmed.replace(/^(\+|00)/, "").replace(/\D/g, "");

  if (digits.startsWith("351") && digits.length === 12) return `351#${digits.slice(3)}`;

  if (digits.length === 9) return `351#${digits}`;

  return trimmed;
}

/**
 * Requests an MB WAY payment push via IfThenPay REST API.
 */
export async function requestMbWayPayment(params: {
  orderId: string;
  amount: number | string;
  phone: string;
  email?: string;
  description?: string;
  notificationUrl?: string;
}): Promise<MbWayPaymentResponse> {
  const mbWayKey = getMbWayKey();
  const formattedAmount =
    typeof params.amount === "number" ? params.amount.toFixed(2) : params.amount;
  const mobileNumber = formatMbWayPhone(params.phone);

  const payload: MbWayPaymentRequest = {
    mbWayKey,
    orderId: params.orderId.slice(0, 15),
    amount: formattedAmount,
    mobileNumber,
    email: params.email?.slice(0, 100),
    description: params.description?.slice(0, 100),
    notificationUrl: params.notificationUrl?.slice(0, 500),
  };

  const response = await fetch(`${IFTHENPAY_API_BASE}/mbway`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IfThenPay MB WAY initialization failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as MbWayPaymentResponse;
}

/**
 * Checks MB WAY payment status by requestId via IfThenPay REST API.
 */
export async function checkMbWayStatus(requestId: string): Promise<MbWayStatusResponse> {
  const mbWayKey = getMbWayKey();
  const url = new URL(`${IFTHENPAY_API_BASE}/mbway/status`);
  url.searchParams.set("mbWayKey", mbWayKey);
  url.searchParams.set("requestId", requestId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IfThenPay MB WAY status check failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as MbWayStatusResponse;
}

/**
 * Verifies X-Ifthenpay-Signature for the notification webhook.
 * Computes HMAC-SHA256 of `orderId + amount + requestId` with the MB WAY key.
 */
export function verifyMbWayNotificationSignature(
  headerSignature: string,
  orderId: string,
  amount: string | number,
  requestId: string
): boolean {
  try {
    const mbWayKey = getMbWayKey();
    const formattedAmount = typeof amount === "number" ? amount.toFixed(2) : amount;
    const signedString = `${orderId}${formattedAmount}${requestId}`;

    const computedSignature = crypto
      .createHmac("sha256", mbWayKey)
      .update(signedString)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(headerSignature.toLowerCase()),
      Buffer.from(computedSignature.toLowerCase())
    );
  } catch {
    return false;
  }
}

export interface HandleMbWayStatusParams {
  requestId: string;
  statusCode: string;
  orderNumber?: string | null;
  orderNumbers?: string[] | null;
  shiftId?: string | null;
  message?: string;
  callerLabel?: string;
}

export interface HandleMbWayStatusResult {
  status: "paid" | "declined" | "expired" | "failed" | "pending";
  message: string;
}

/**
 * Centrally handles MB WAY status transitions across Webhook and SSE Status polling.
 * Promotes Redis sessions, settles PostgreSQL orders, sets Redis cache, and emits broadcast events.
 */
export async function handleMbWayStatusUpdate(
  params: HandleMbWayStatusParams
): Promise<HandleMbWayStatusResult> {
  const { requestId, statusCode, callerLabel } = params;
  const redis = getRedisClient();

  let existingCached: Record<string, unknown> = {};
  try {
    const rawCached = await redis.get(`mbway:req:${requestId}`);
    if (rawCached) {
      existingCached = JSON.parse(rawCached) as Record<string, unknown>;
    }
  } catch {
    // ignore cache parse errors
  }

  const orderNumber =
    params.orderNumber ??
    (typeof existingCached.orderNumber === "string" ? existingCached.orderNumber : null);
  const orderNumbers =
    params.orderNumbers ??
    (Array.isArray(existingCached.orderNumbers) ? (existingCached.orderNumbers as string[]) : null);
  const shiftId =
    params.shiftId ?? (typeof existingCached.shiftId === "string" ? existingCached.shiftId : null);

  const normalizedOrderNumbers =
    Array.isArray(orderNumbers) && orderNumbers.length > 0
      ? orderNumbers.map((s) => String(s).trim()).filter(Boolean)
      : orderNumber
        ? orderNumber
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
  const primaryOrderNumber = normalizedOrderNumbers[0] || orderNumber || null;

  const cacheAndBroadcast = async (
    status: "paid" | "declined" | "expired" | "failed",
    message: string
  ): Promise<HandleMbWayStatusResult> => {
    await redis.set(
      `mbway:req:${requestId}`,
      JSON.stringify({
        ...existingCached,
        requestId,
        status,
        orderNumber: primaryOrderNumber,
        orderNumbers: normalizedOrderNumbers.length > 0 ? normalizedOrderNumbers : undefined,
        shiftId,
        message,
      }),
      "EX",
      600
    );
    const payload = {
      status,
      orderNumber: primaryOrderNumber || undefined,
      requestId,
      message,
    };
    paymentBroadcaster.emitPaymentUpdate(requestId, payload);
    for (const num of normalizedOrderNumbers) {
      paymentBroadcaster.emitPaymentUpdate(num, { ...payload, orderNumber: num });
    }
    return { status, message };
  };

  if (statusCode === MBWAY_STATUS.PAID) {
    const successMsg = params.message || "Pagamento confirmado!";

    if (primaryOrderNumber) {
      const lockKey = `mbway:lock:${primaryOrderNumber}`;
      const lockAcquired = await redis.set(lockKey, "1", "EX", 60, "NX");

      if (lockAcquired) {
        try {
          const session = await getCheckoutSession(primaryOrderNumber);
          if (session) {
            await promoteRedisCheckoutSession(session, requestId, "mbway");
          } else if (normalizedOrderNumbers.length > 0) {
            const existingOrders = (
              await Promise.all(normalizedOrderNumbers.map((num) => getOrderByNumber(num)))
            ).filter((ord): ord is NonNullable<typeof ord> => ord !== null);

            if (existingOrders.length > 0) {
              await finalizePaidOrders({
                orderNumbers: existingOrders.map((o) => o.order_number),
                paymentReference: requestId,
                paymentCheckedBy: callerLabel || "ifthenpay-mbway",
                paymentMethod: "mbway",
                shiftId: shiftId ?? null,
              });
            }
          }
        } catch (err) {
          await redis.del(lockKey).catch(() => {});
          throw err;
        }
      }
    }

    return cacheAndBroadcast("paid", successMsg);
  }

  if (statusCode === MBWAY_STATUS.DECLINED) {
    return cacheAndBroadcast(
      "declined",
      params.message || "Pagamento recusado pelo utilizador na app MB WAY."
    );
  }

  if (statusCode === MBWAY_STATUS.EXPIRED) {
    return cacheAndBroadcast(
      "expired",
      params.message || "Tempo de autorização MB WAY expirado (4 minutos)."
    );
  }

  return cacheAndBroadcast("failed", params.message || "Pagamento MB WAY não concluído.");
}
