import { sendEmail } from "@/lib/email";
import {
  getPaidOrderEmailTemplate,
  getPendingOrderEmailTemplate,
} from "@/lib/email/templates/shop";
import {
  getOrderByNumber,
  settleOrdersBatch,
  getProduct,
  getProductNoCache,
  validateDiscountCode,
} from "@/lib/db/repositories/shop.repository";
import { EventHookJob, CheckoutSessionData, StockRequestItem } from "@/types/redis";
import { enqueueStreamJob, scheduleDelayedJob } from "@/lib/redis/queue";
import {
  getStatusLabel,
  isCashPayment,
  isSettledOrderStatus,
  isTicketOrder,
} from "@/utils/shop/orderStatusUtils";
import { getDictionary } from "@/i18n/dictionaries";
import { getActivityByIdNoCache, signUpToEvent } from "@/lib/db/repositories/event.repository";
import { PaymentMethod } from "@/types/shop/payment";
import type { Order, CreateOrderPaymentInput } from "@/types/shop/order";
import type { Product, ProductChannel } from "@/types/shop/product";
import { lineTotalMoney, addMoney, subtractMoney } from "@/utils/shop/moneyUtils";

export interface BuildOrderPaymentParams {
  method?: PaymentMethod | null;
  status: "pending" | "successful";
  shiftId?: string | null;
  receivedBy?: string | null;
  reference?: string | null;
}

export function buildOrderPaymentInput(
  params: BuildOrderPaymentParams
): CreateOrderPaymentInput | undefined {
  if (!params.method) return undefined;

  return {
    method: params.method,
    status: params.status,
    shift_id: params.shiftId ?? null,
    received_by: params.status === "successful" ? (params.receivedBy ?? null) : null,
    reference: isCashPayment(params.method) ? null : (params.reference ?? null),
  };
}

async function createOrderFromCheckoutSession(
  session: CheckoutSessionData,
  payment?: CreateOrderPaymentInput
): Promise<Order | null> {
  const { createOrder } = await import("@/lib/db/repositories/shop.repository");

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
    items: session.items,
    payment,
  });
}

async function promoteCheckoutSession(
  session: CheckoutSessionData,
  payment?: CreateOrderPaymentInput,
  onCreated?: (_order: Order) => Promise<void>
): Promise<Order | null> {
  const { discardCheckoutSession } = await import("@/lib/redis/sessions");
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

export async function promoteRedisCheckoutSession(
  session: CheckoutSessionData,
  reference: string,
  paymentMethodOverride?: PaymentMethod
): Promise<Order | null> {
  const effectiveMethod = paymentMethodOverride ?? session.payment_method;
  if (!effectiveMethod) return null;

  return promoteCheckoutSession(
    session,
    {
      method: effectiveMethod,
      status: "successful",
      reference,
      amount: session.total_amount,
      shift_id: session.shift_id ?? undefined,
    },
    async (createdOrder) => {
      await enqueueEventTicketHooks(createdOrder);
      sendOrderPaidEmails(createdOrder, reference);
    }
  );
}

/**
 * Converts an in-flight Redis checkout session into a pending reservation
 * without releasing its stock hold until PostgreSQL has the order
 */
export async function promoteRedisCheckoutSessionToReservation(
  session: CheckoutSessionData
): Promise<Order | null> {
  return promoteCheckoutSession(session, undefined, async (createdOrder) => {
    await schedulePendingOrderExpiry(createdOrder);
    await sendPendingOrderEmail(createdOrder);
  });
}

export async function executeEventTicketHook(job: EventHookJob): Promise<void> {
  // Registration failure propagates (job retries), only the email is best-effort.
  const ticket = await signUpToEvent(job.event_id, job.user_istid, job.order_number);
  try {
    const { getUserNoCache } = await import("@/lib/db/repositories/user.repository");

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

    const { sendEventTicketEmail } = await import("@/lib/email");
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
    const { customDeadlineIso } = await computeReservationExpiryMs(order);
    await sendEmail({
      to: order.customer_email,
      subject: `Encomenda ${order.order_number} - Pendente`,
      html: getPendingOrderEmailTemplate(
        order.order_number,
        order.customer_name || "Cliente",
        order.items,
        Number(order.total_amount),
        order.campus ?? undefined,
        paymentMethod,
        customDeadlineIso,
        undefined,
        isTicketOrder(order)
      ),
    });
  } catch (emailErr) {
    console.warn("Pending order email couldn't be sent:", emailErr);
  }
}

export function sendOrderPaidEmails(order: Order, paymentReference?: string): void {
  if (!order.customer_email || order.order_source === "fast-pos") return;
  const ordersTableDict = getDictionary("pt").orders_table;
  sendEmail({
    to: order.customer_email,
    subject: `Encomenda ${order.order_number} - ${getStatusLabel("paid", ordersTableDict.status, {
      isTicket: isTicketOrder(order),
      ticketConfirmedLabel: ordersTableDict.ticket_confirmed,
    })}`,
    html: getPaidOrderEmailTemplate(
      order.order_number,
      order.customer_name ?? "Cliente",
      order.items,
      Number(order.total_amount),
      order.campus ?? undefined,
      order.payment_method ?? undefined,
      isCashPayment(order.payment_method) ? undefined : paymentReference,
      undefined,
      order.pickup_deadline ?? undefined
    ),
  }).catch((err) => console.warn("Confirmation email couldn't be sent:", err));
}

export interface FinalizePaidOrdersOptions {
  orderNumbers: string[];
  paymentReference?: string | null;
  paymentCheckedBy: string;
  paymentMethod: PaymentMethod;
  shiftId?: string | null;
}

export type FinalizePaidOrdersResult =
  | { success: true; orders: Order[]; alreadyProcessed?: boolean }
  | { success: false; error: string; statusCode: number };

export type FinalizePaidOrderResult =
  | { success: true; alreadyProcessed?: boolean }
  | { success: false; error: string; statusCode: number };

export async function finalizePaidOrders({
  orderNumbers,
  paymentReference,
  paymentCheckedBy,
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
    by: paymentCheckedBy,
  });

  if (!updatedOrders || updatedOrders.length === 0)
    return {
      success: false,
      error: "Failed to settle orders",
      statusCode: 500,
    };

  // Trigger post-settlement side effects for each settled order
  for (const ord of updatedOrders) {
    await enqueueEventTicketHooks(ord);
    sendOrderPaidEmails(ord, reference ?? undefined);
  }

  return {
    success: true,
    orders: [...alreadySettled, ...updatedOrders],
    alreadyProcessed: alreadySettled.length > 0 && unsettled.length === 0,
  };
}

export async function finalizePaidOrder({
  orderNumber,
  orderId,
  paymentReference,
  paymentCheckedBy,
  paymentMethod,
  shiftId,
}: {
  orderNumber?: string;
  orderId?: string | number;
  paymentReference?: string | null;
  paymentCheckedBy: string;
  paymentMethod: PaymentMethod;
  shiftId?: string | null;
}): Promise<FinalizePaidOrderResult> {
  const resolvedNumber = String(orderNumber ?? orderId ?? "").trim();
  const res = await finalizePaidOrders({
    orderNumbers: [resolvedNumber],
    paymentReference,
    paymentCheckedBy,
    paymentMethod,
    shiftId,
  });

  if (!res.success) return { success: false, error: res.error, statusCode: res.statusCode };

  return { success: true, alreadyProcessed: res.alreadyProcessed };
}

export async function validateAndPriceCartItems(
  itemsInput: StockRequestItem[],
  options: {
    channel?: ProductChannel;
    userIstid?: string | null;
    discountCode?: string | null;
    enforceChannel?: boolean;
    enforceTicketRules?: boolean;
  } = {}
): Promise<
  | { isValid: true; finalAmount: number; productsMap: Map<number, Product> }
  | { isValid: false; error: string }
> {
  const {
    channel = "web",
    userIstid = null,
    discountCode = null,
    enforceChannel = true,
    enforceTicketRules = true,
  } = options;

  if (!itemsInput || itemsInput.length === 0) {
    return { isValid: false, error: "O carrinho está vazio." };
  }

  const productIds = new Set<number>(itemsInput.map((it) => it.product_id));
  const fetchedProducts = await Promise.all([...productIds].map((id) => getProduct(id)));

  if (fetchedProducts.some((p) => p == null)) {
    return { isValid: false, error: "Produto inválido no pedido." };
  }

  const productsMap = new Map<number, Product>();
  for (const p of fetchedProducts) {
    if (!p) continue;
    if (enforceChannel && p.channels && !p.channels.includes(channel)) {
      return {
        isValid: false,
        error: `O produto "${p.name}" não está disponível para encomenda no canal ${channel}.`,
      };
    }
    productsMap.set(p.id, p);
  }

  if (enforceTicketRules) {
    const hasTickets = fetchedProducts.some((p) => p?.product_type === "event_ticket");
    const hasMerchandise = fetchedProducts.some((p) => p?.product_type === "merchandise");
    if (hasTickets && hasMerchandise) {
      return {
        isValid: false,
        error: "Bilhetes de eventos não podem ser encomendados juntamente com outros produtos.",
      };
    }

    for (const it of itemsInput) {
      const prod = productsMap.get(it.product_id);
      if (prod?.product_type === "event_ticket" && (it.quantity ?? 1) > 1) {
        return {
          isValid: false,
          error: "Apenas é permitido 1 bilhete por utilizador.",
        };
      }
    }
  }

  let calculatedTotal = 0;
  for (const it of itemsInput) {
    const prod = productsMap.get(it.product_id)!;
    const variant = it.variant_id
      ? (prod.variants?.find((v) => v.id === it.variant_id) ?? null)
      : null;
    const lineTotal = lineTotalMoney(prod.price, variant?.price_modifier ?? 0, it.quantity ?? 1);
    calculatedTotal = addMoney(calculatedTotal, lineTotal);
  }

  let discountAmount = 0;
  const cleanCode = typeof discountCode === "string" ? discountCode.trim() : "";
  if (cleanCode) {
    const validation = await validateDiscountCode(
      cleanCode,
      userIstid,
      itemsInput.map((it) => ({
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        quantity: it.quantity ?? 1,
      }))
    );

    if (!validation?.is_valid) {
      return {
        isValid: false,
        error: validation?.error || "Invalid discount code.",
      };
    }
    discountAmount = Math.min(calculatedTotal, Number(validation.discount_amount) || 0);
  }

  return {
    isValid: true,
    finalAmount: Math.max(0, subtractMoney(calculatedTotal, discountAmount)),
    productsMap,
  };
}
