import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";
import {
  getActivityByIdNoCache,
  signUpToEventNoCache,
} from "@/lib/db/repositories/event.repository";
import {
  createOrder,
  getOrderByNumber,
  getProductNoCache,
  settleOrdersBatch,
} from "@/lib/db/repositories/shop.repository";
import { getUserNoCache, updateUser } from "@/lib/db/repositories/user.repository";
import { sendEmail, sendEventTicketEmail } from "@/lib/email";
import {
  getPaidOrderEmailTemplate,
  getPendingOrderEmailTemplate,
} from "@/lib/email/templates/shop";
import {
  discardCheckoutSession,
  getCheckoutSession,
  setCartIdOrderNumber,
} from "@/lib/redis/sessions";
import { getRedisClient } from "@/lib/redis/client";
import { enqueueStreamJob, scheduleDelayedJob } from "@/lib/redis/queue";
import type { CheckoutSessionData, EventHookJob } from "@/types/redis";
import type {
  BuildOrderPaymentParams,
  CreateOrderPaymentInput,
  FinalizePaidOrderResult,
  FinalizePaidOrdersOptions,
  FinalizePaidOrdersResult,
  Order,
  RunPaidOrderSideEffectsOptions,
} from "@/types/shop/order";
import type { PaymentMethod } from "@/types/shop/payment";
import {
  getStatusLabel,
  isCashPayment,
  isSettledOrderStatus,
  isTicketOrder,
} from "@/utils/shop/orderStatusUtils";

export function buildOrderPaymentInput(
  params: BuildOrderPaymentParams
): CreateOrderPaymentInput | undefined {
  if (!params.method) return undefined;

  return {
    method: params.method,
    status: params.status,
    shift_id: params.shiftId ?? null,
    received_by: params.status === "successful" ? (params.receivedBy ?? null) : null,
    verified_by: params.status === "successful" ? (params.verifiedBy ?? null) : null,
    reference: isCashPayment(params.method) ? null : (params.reference ?? null),
    ...(params.amount !== undefined ? { amount: params.amount } : {}),
  };
}

async function syncUserPhoneFromOrder(order: Order): Promise<void> {
  const phone = order.customer_phone?.trim();
  if (!order.user_istid || !phone) return;
  const targetUser = await getUserNoCache(order.user_istid);
  if (targetUser && targetUser.phone !== phone) await updateUser(order.user_istid, { phone });
}

/**
 * Post payment side effects (cart idempotency mapping, event ticket hooks, paid emails).
 */
export async function runPaidOrderSideEffects(
  order: Order,
  options: RunPaidOrderSideEffectsOptions = {}
): Promise<void> {
  const cleanCartId = typeof options.cartId === "string" ? options.cartId.trim() : "";
  if (cleanCartId) {
    await setCartIdOrderNumber(cleanCartId, order.order_number);
  }

  await syncUserPhoneFromOrder(order);
  await enqueueEventTicketHooks(order);
  sendOrderPaidEmails(order, options.paymentReference ?? undefined);
}

/**
 * Post reservation side effects (expiration scheduling and pending email dispatch).
 */
export async function runPendingOrderSideEffects(
  order: Order,
  paymentMethod?: PaymentMethod
): Promise<void> {
  await syncUserPhoneFromOrder(order);
  await schedulePendingOrderExpiry(order);
  await sendPendingOrderEmail(order, paymentMethod);
}

async function createOrderFromCheckoutSession(
  session: CheckoutSessionData,
  payment?: CreateOrderPaymentInput
): Promise<Order | null> {
  return createOrder({
    order_number: session.order_number,
    order_source: session.order_source || "web",
    user_istid: session.user_istid,
    customer_name: session.customer_name || "Cliente",
    customer_email: session.customer_email || null,
    customer_phone: session.customer_phone || null,
    customer_nif: session.customer_nif || null,
    campus: session.campus || null,
    notes: session.notes || null,
    discount_code: session.discount_code || undefined,
    stock_override: session.stock_override,
    created_by: session.created_by,
    terms_accepted_at: session.terms_accepted_at ?? null,
    terms_version: session.terms_version ?? null,
    locale: session.locale ?? "pt",
    items: session.items,
    payment,
  });
}

async function promoteCheckoutSession(
  session: CheckoutSessionData,
  payment?: CreateOrderPaymentInput,
  onCreated?: (_order: Order) => Promise<void>
): Promise<Order | null> {
  const { revalidatePath } = await import("next/cache");

  const createdOrder = await createOrderFromCheckoutSession(session, payment);
  if (!createdOrder) return null;

  // The PostgreSQL order now owns the stock; release the Redis hold.
  await discardCheckoutSession(session.order_number);
  if (onCreated) await onCreated(createdOrder);

  revalidatePath("/orders");
  revalidatePath("/my-orders");
  return createdOrder;
}

async function promoteRedisCheckoutSession(
  session: CheckoutSessionData,
  reference: string,
  paymentMethodOverride?: PaymentMethod,
  verifiedBy: string | null = null
): Promise<Order | null> {
  const effectiveMethod = paymentMethodOverride ?? session.payment_method;
  if (!effectiveMethod) return null;

  return promoteCheckoutSession(
    session,
    buildOrderPaymentInput({
      method: effectiveMethod,
      status: "successful",
      reference,
      amount: session.total_amount,
      shiftId: session.shift_id ?? null,
      verifiedBy,
    }),
    async (createdOrder) => {
      await runPaidOrderSideEffects(createdOrder, {
        paymentReference: reference,
        cartId: session.cart_id,
      });
    }
  );
}

/**
 * Converts an in-flight Redis checkout session into a pending reservation
 * without releasing its stock hold until PostgreSQL has the order.
 */
export async function promoteRedisCheckoutSessionToReservation(
  session: CheckoutSessionData
): Promise<Order | null> {
  return promoteCheckoutSession(session, undefined, (createdOrder) =>
    runPendingOrderSideEffects(createdOrder)
  );
}

export async function executeEventTicketHook(job: EventHookJob): Promise<void> {
  // Registration failure propagates (job retries), only the email is best-effort.
  const ticket = await signUpToEventNoCache(job.event_id, job.user_istid, job.order_number);
  try {
    const [activity, user] = await Promise.all([
      getActivityByIdNoCache(job.event_id),
      getUserNoCache(job.user_istid),
    ]);

    if (!activity || !user) return;
    const recipientEmail = (user.alternativeEmailVerified && user.alternativeEmail) || user.email;
    if (!recipientEmail) return;

    const ticketCode = ticket?.ticket_code || "CONFIRMED";
    const start = activity.start || new Date();
    const end = activity.end || null;

    await sendEventTicketEmail({
      eventId: activity.id,
      eventTitle: activity.title,
      eventDescription: activity.description,
      eventLocation: activity.location,
      eventStart: start,
      eventEnd: end,
      attendeeName: user.name,
      recipientEmail,
      ticketCode,
      orderNumber: job.order_number,
    });
  } catch (emailErr) {
    console.error("[executeEventTicketHook] Failed to dispatch ticket email:", emailErr);
  }
}

export async function enqueueEventTicketHooks(order: Order): Promise<void> {
  if (!order.user_istid) return;
  for (const item of order.items) {
    if (!item.event_id) continue;
    try {
      await enqueueStreamJob({
        type: "event_hook",
        order_number: order.order_number,
        event_id: item.event_id,
        user_istid: order.user_istid,
      });
    } catch (error) {
      console.error("Failed to enqueue event hook job:", {
        orderNumber: order.order_number,
        error,
      });
    }
  }
}

export async function computeReservationExpiryMs(
  order: Order
): Promise<{ deadlineMs: number; customDeadlineIso: string | null }> {
  const createdMs = order.created_at ? new Date(order.created_at).getTime() : Date.now();
  const baseCreatedMs = Number.isFinite(createdMs) ? createdMs : Date.now();
  const default72hMs = baseCreatedMs + 72 * 60 * 60 * 1000;
  let deadlineMs = default72hMs;
  const nowMs = Date.now();

  for (const item of order.items || []) {
    const product = item.product_id ? await getProductNoCache(item.product_id) : null;
    if (product?.order_deadline) {
      const orderDeadlineMs = new Date(product.order_deadline).getTime();
      if (Number.isFinite(orderDeadlineMs) && orderDeadlineMs > nowMs)
        deadlineMs = Math.min(deadlineMs, orderDeadlineMs);
    }

    const eventId = item.event_id || product?.event_id;
    if (eventId) {
      const activity = await getActivityByIdNoCache(eventId);
      if (activity?.signupDeadline) {
        const signupDeadlineMs = new Date(activity.signupDeadline).getTime();
        if (Number.isFinite(signupDeadlineMs) && signupDeadlineMs > nowMs)
          deadlineMs = Math.min(deadlineMs, signupDeadlineMs);
      }

      if (activity?.start) {
        const startMs = new Date(activity.start).getTime();
        if (Number.isFinite(startMs) && startMs > nowMs) deadlineMs = Math.min(deadlineMs, startMs);
      }
    }
  }

  return {
    deadlineMs,
    customDeadlineIso: deadlineMs < default72hMs ? new Date(deadlineMs).toISOString() : null,
  };
}

export async function schedulePendingOrderExpiry(order: Order): Promise<void> {
  try {
    const { deadlineMs } = await computeReservationExpiryMs(order);
    await scheduleDelayedJob({ type: "expire", order_number: order.order_number }, deadlineMs);
  } catch (jobErr) {
    console.error(
      `FAILED to schedule auto-cancel for order ${order.order_number} — it will never expire automatically and needs a manual cancel.`,
      jobErr
    );
  }
}

export async function sendPendingOrderEmail(
  order: Order,
  paymentMethod?: PaymentMethod
): Promise<void> {
  if (!order.customer_email) return;

  try {
    const orderLocale = isValidLocale(order.locale) ? order.locale : defaultLocale;
    const { customDeadlineIso } = await computeReservationExpiryMs(order);
    await sendEmail({
      to: order.customer_email,
      subject:
        orderLocale === "en"
          ? `Order ${order.order_number} - Pending`
          : `Encomenda ${order.order_number} - Pendente`,
      html: getPendingOrderEmailTemplate(
        order.order_number,
        order.customer_name,
        order.items,
        Number(order.total_amount),
        order.campus ?? undefined,
        paymentMethod,
        customDeadlineIso,
        undefined,
        isTicketOrder(order),
        orderLocale
      ),
    });
  } catch (emailErr) {
    console.warn("Pending order email couldn't be sent:", emailErr);
  }
}

export function sendOrderPaidEmails(order: Order, paymentReference?: string): void {
  if (!order.customer_email || order.order_source === "fast-pos") return;
  const orderLocale = isValidLocale(order.locale) ? order.locale : defaultLocale;
  const ordersTableDict = getDictionary(orderLocale).orders_table;
  const orderPrefix = orderLocale === "en" ? "Order" : "Encomenda";
  sendEmail({
    to: order.customer_email,
    subject: `${orderPrefix} ${order.order_number} - ${getStatusLabel(
      "paid",
      ordersTableDict.status,
      {
        isTicket: isTicketOrder(order),
        ticketConfirmedLabel: ordersTableDict.ticket_confirmed,
      }
    )}`,
    html: getPaidOrderEmailTemplate(
      order.order_number,
      order.customer_name,
      order.items,
      Number(order.total_amount),
      order.campus ?? undefined,
      order.payment_method ?? undefined,
      isCashPayment(order.payment_method) ? undefined : paymentReference,
      undefined,
      order.pickup_deadline ?? undefined,
      orderLocale
    ),
  }).catch((err) => console.warn("Confirmation email couldn't be sent:", err));
}

export async function finalizePaidOrders({
  orderNumbers,
  paymentReference,
  receivedBy,
  verifiedBy,
  paymentMethod,
  shiftId,
}: FinalizePaidOrdersOptions): Promise<FinalizePaidOrdersResult> {
  if (!orderNumbers || orderNumbers.length === 0) {
    return { success: false, error: "No orders to settle", statusCode: 400 };
  }

  if (!paymentMethod) {
    return {
      success: false,
      error: "Missing payment method",
      statusCode: 400,
    };
  }

  const effectiveMethod = paymentMethod;
  const resolvedShiftId = shiftId ?? null;
  const reference = String(paymentReference ?? "").trim() || null;

  if (!reference && !isCashPayment(effectiveMethod)) {
    return {
      success: false,
      error: "Missing payment reference",
      statusCode: 400,
    };
  }

  const redis = getRedisClient();
  const lockKey = `order:settle:lock:${orderNumbers[0]}`;
  const lockAcquired = await redis.set(lockKey, "1", "EX", 60, "NX");
  if (!lockAcquired) {
    const settled = (await Promise.all(orderNumbers.map((num) => getOrderByNumber(num)))).filter(
      (ord): ord is Order => ord !== null
    );
    return { success: true, orders: settled, alreadyProcessed: true };
  }

  try {
    if (orderNumbers.length === 1 && !(await getOrderByNumber(orderNumbers[0]))) {
      const session = await getCheckoutSession(orderNumbers[0]);
      if (session) {
        const promoted = await promoteRedisCheckoutSession(
          session,
          reference ?? "",
          effectiveMethod,
          verifiedBy
        );
        if (!promoted) {
          return { success: false, error: "Failed to promote order", statusCode: 500 };
        }
        return { success: true, orders: [promoted], alreadyProcessed: false };
      }
    }

    // Inspect existing orders to detect already-settled items
    const existingOrders: Order[] = [];
    for (const num of orderNumbers) {
      const ord = await getOrderByNumber(num);
      if (!ord) {
        return {
          success: false,
          error: `Order ${num} not found`,
          statusCode: 404,
        };
      }
      existingOrders.push(ord);
    }

    const alreadySettled = existingOrders.filter((order) => isSettledOrderStatus(order.status));
    const unsettled = existingOrders.filter((order) => !isSettledOrderStatus(order.status));

    if (unsettled.length === 0)
      return {
        success: true,
        orders: alreadySettled,
        alreadyProcessed: true,
      };

    const unsettledNumbers = unsettled.map((order) => order.order_number);
    const updatedOrders = await settleOrdersBatch(unsettledNumbers, effectiveMethod, {
      shift_id: resolvedShiftId,
      reference: isCashPayment(effectiveMethod) ? null : reference,
      by: receivedBy,
      verified_by: verifiedBy,
    });

    if (!updatedOrders || updatedOrders.length === 0)
      return {
        success: false,
        error: "Failed to settle orders",
        statusCode: 500,
      };

    // Trigger post-settlement side effects for each settled order
    for (const ord of updatedOrders) {
      await runPaidOrderSideEffects(ord, { paymentReference: reference });
    }

    return {
      success: true,
      orders: [...alreadySettled, ...updatedOrders],
      alreadyProcessed: alreadySettled.length > 0 && unsettled.length === 0,
    };
  } finally {
    await redis.del(lockKey).catch(() => {});
  }
}

export async function finalizePaidOrder({
  orderNumber,
  orderId,
  paymentReference,
  receivedBy,
  verifiedBy,
  paymentMethod,
  shiftId,
}: {
  orderNumber?: string;
  orderId?: string | number;
  paymentReference?: string | null;
  receivedBy: string | null;
  verifiedBy: string | null;
  paymentMethod: PaymentMethod;
  shiftId?: string | null;
}): Promise<FinalizePaidOrderResult> {
  const resolvedNumber = String(orderNumber ?? orderId ?? "").trim();
  const res = await finalizePaidOrders({
    orderNumbers: [resolvedNumber],
    paymentReference,
    receivedBy,
    verifiedBy,
    paymentMethod,
    shiftId,
  });

  if (!res.success) return { success: false, error: res.error, statusCode: res.statusCode };

  return { success: true, alreadyProcessed: res.alreadyProcessed };
}
