"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission, requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import {
  getAllOrders,
  getOrderByNumber,
  getOrderItemById,
  setOrderItemStatus,
  setOrderItemsStatusBatch,
  cancelOrder,
  updateOrder,
} from "@/lib/db/repositories/shop.repository";
import { signUpToEvent } from "@/lib/db/repositories/event.repository";
import { Order } from "@/types/shop/order";
import { OrderStatus } from "@/types/shop/orderStatus";
import {
  PaymentMethod,
  isPaymentMethod,
  isPaymentMethodAllowedForChannel,
} from "@/types/shop/payment";
import { sendEmail } from "@/lib/email";
import {
  getPaidOrderEmailTemplate,
  getPendingOrderEmailTemplate,
  getStatusUpdateOrderEmailTemplate,
} from "@/lib/email/templates/shop";
import { interpolateEmailVariables, renderEmailMarkdownToHtml } from "@/lib/email/baseEmail";
import {
  canTransitionOrderStatus,
  getStatusLabel,
  isTicketOrder,
} from "@/utils/shop/orderStatusUtils";
import { computeReservationExpiryMs, finalizePaidOrders } from "@/utils/shop/orderFinalization";
import { getDictionary } from "@/i18n/dictionaries";

export async function getAllOrdersAction(): Promise<Order[]> {
  const session = await requirePermission("orders:read");
  const orders = await getAllOrders();
  const canReadCustomer = hasPermission(session.user, "orders:read_customer");
  if (!canReadCustomer) {
    return orders.map((order) => ({
      ...order,
      customer_email: undefined,
      customer_phone: undefined,
      customer_nif: undefined,
    }));
  }
  return orders;
}

export async function setOrderStatusAction(
  orderNumber: string,
  nextStatus: OrderStatus
): Promise<Order> {
  const session = await requireUser();
  const user = session.user;
  const canWrite = hasPermission(user, "orders:write");
  const canOverride = hasPermission(user, "orders:override");
  const canDeliver = hasPermission(user, "orders:deliver");

  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");

  if (nextStatus === "paid") throw new Error("Use settlePosOrderAction to mark order as paid");

  if (nextStatus === "cancelled") {
    await cancelOrderAction(orderNumber);
    const cancelledOrder = await getOrderByNumber(orderNumber);
    if (!cancelledOrder) throw new Error("Failed to cancel order");
    return cancelledOrder;
  }

  if (!canTransitionOrderStatus(order.status, nextStatus, isTicketOrder(order))) {
    if (!canOverride)
      throw new Error(`Cannot transition order from ${order.status} to ${nextStatus}`);
  }

  if (nextStatus === "delivered") {
    if (!canDeliver && !canWrite && !canOverride)
      throw new Error("Forbidden: orders:deliver required");
  } else if (!canWrite && !canOverride) {
    throw new Error("Forbidden: orders:write required");
  }

  const itemIds = order.items.map((i) => i.id).filter((id): id is number => typeof id === "number");
  if (itemIds.length > 0) await setOrderItemsStatusBatch(itemIds, nextStatus, user.istid);

  const updated = await getOrderByNumber(order.order_number);
  if (!updated) throw new Error("Failed to update order status");

  if (updated.customer_email) {
    const statusLabel = getStatusLabel(updated.status, getDictionary("pt").orders_table.status);
    const subject = `Encomenda ${updated.order_number} - ${statusLabel}`;
    const html = getStatusUpdateOrderEmailTemplate(
      updated.order_number,
      updated.customer_name ?? "Cliente",
      updated.status,
      statusLabel,
      updated.campus ?? undefined,
      updated.pickup_deadline ?? undefined
    );
    void sendEmail({ to: updated.customer_email, subject, html }).catch(() => {});
  }

  revalidateTag("orders", "max");
  revalidateTag(`order-${updated.order_number}`, "max");
  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return updated;
}

export async function updateOrderAction(
  orderNumber: string,
  updates: Record<string, unknown>
): Promise<Order> {
  const session = await requireUser();
  const user = session.user;
  const canWrite = hasPermission(user, "orders:write");
  const canOverride = hasPermission(user, "orders:override");
  if (!canWrite && !canOverride) throw new Error("Forbidden: orders:write required");

  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");

  const allowedFields = [
    "delivered_at",
    "delivered_by",
    "notes",
    "payment_reference",
    "pickup_deadline",
    "campus",
    "nif",
  ];

  const filteredUpdates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  if (updates.payment_method !== undefined) {
    if (!isPaymentMethod(updates.payment_method)) throw new Error("Invalid payment method");
    filteredUpdates.payment_method = updates.payment_method;
  }

  if (updates.customer_nif !== undefined) filteredUpdates.nif = updates.customer_nif;

  if (Object.keys(filteredUpdates).length === 0) throw new Error("No updatable fields provided");

  const updated = await updateOrder(order.order_number, filteredUpdates, false, user.istid);
  if (!updated) throw new Error("Failed to update order");

  if (
    updates.pickup_deadline !== undefined &&
    updated.customer_email &&
    updated.pickup_deadline &&
    order.status !== "delivered" &&
    order.status !== "cancelled"
  ) {
    const formattedDeadline = new Date(updated.pickup_deadline).toLocaleDateString("pt-PT");
    const subject = `Encomenda ${updated.order_number} - Prazo Limite para Levantamento (${formattedDeadline})`;
    const statusLabel = getStatusLabel(updated.status, getDictionary("pt").orders_table.status);
    const html = getStatusUpdateOrderEmailTemplate(
      updated.order_number,
      updated.customer_name ?? "Cliente",
      updated.status,
      statusLabel,
      updated.campus ?? undefined,
      updated.pickup_deadline
    );
    void sendEmail({ to: updated.customer_email, subject, html }).catch(() => {});
  }

  revalidateTag("orders", "max");
  revalidateTag(`order-${updated.order_number}`, "max");
  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return updated;
}

export async function cancelOrderAction(orderNumber: string): Promise<boolean> {
  const session = await requireUser();
  const user = session.user;
  const canWrite = hasPermission(user, "orders:write");
  const canOverride = hasPermission(user, "orders:override");
  const canPos = hasPermission(user, "pos:access");

  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");

  if (order.status === "cancelled") throw new Error("Order is already cancelled");

  const isOwner = order.user_istid === user.istid;
  if (order.status !== "pending") {
    if (!canOverride)
      throw new Error("Forbidden: orders:override required to cancel a non-pending order");
  } else {
    if (!canWrite && !canOverride && !canPos && !isOwner)
      throw new Error("Forbidden: orders:write, orders:override, or pos:access required");
  }

  await cancelOrder(orderNumber, user.istid);
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return true;
}

export async function setOrderItemStatusAction(
  orderItemId: number,
  status: OrderStatus
): Promise<{ success: boolean; orderItemId: number; status: OrderStatus }> {
  const session = await requireUser();
  const canOverride = hasPermission(session.user, "orders:override");
  const canWrite = hasPermission(session.user, "orders:write");
  const canDeliver = hasPermission(session.user, "orders:deliver");

  if (status === "cancelled") {
    const item = await getOrderItemById(orderItemId);
    if (!item) throw new Error("Order item not found");

    if (item.status === "cancelled") throw new Error("Order item is already cancelled");

    if (item.status !== "pending") {
      if (!canOverride)
        throw new Error("Forbidden: orders:override required to cancel a non-pending order item");
    } else {
      if (!canWrite && !canOverride)
        throw new Error("Forbidden: orders:write or orders:override required to cancel item");
    }

    const updatedOrder = await setOrderItemStatus(orderItemId, status, session.user.istid);
    revalidateTag("orders", "max");
    if (updatedOrder?.order_number) revalidateTag(`order-${updatedOrder.order_number}`, "max");

    revalidatePath("/orders");
    revalidatePath("/my-orders");
    return { success: true, orderItemId, status };
  }

  if (status === "delivered") {
    if (!canDeliver && !canWrite && !canOverride)
      throw new Error("Forbidden: orders:deliver required");
  } else {
    if (!canWrite && !canOverride) throw new Error("Forbidden: orders:write required");
  }

  const updatedOrder = await setOrderItemStatus(orderItemId, status, session.user.istid);
  revalidateTag("orders", "max");
  if (updatedOrder?.order_number) revalidateTag(`order-${updatedOrder.order_number}`, "max");

  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return { success: true, orderItemId, status };
}

export async function batchSetOrderItemsStatusAction(
  orderNumber: string,
  deliveredItemIds: number[]
): Promise<{ success: boolean; count: number }> {
  const session = await requirePermission("orders:deliver");

  await setOrderItemsStatusBatch(deliveredItemIds, "delivered", session.user.istid);
  revalidateTag("orders", "max");
  revalidateTag(`order-${orderNumber}`, "max");
  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return { success: true, count: deliveredItemIds.length };
}

export async function resendOrderEmailAction(orderNumber: string): Promise<{ success: boolean }> {
  await requirePermission("orders:write");
  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");
  if (!order.customer_email) throw new Error("Cliente não possui email associado");

  const statusLabel = getStatusLabel(order.status, getDictionary("pt").orders_table.status);
  let subject = `Encomenda ${order.order_number} - ${statusLabel}`;
  let html: string;

  if (order.status === "paid" || order.status === "delivered") {
    subject = `Encomenda ${order.order_number} - Pagamento Confirmado`;
    html = getPaidOrderEmailTemplate(
      order.order_number,
      order.customer_name ?? "Cliente",
      order.items,
      Number(order.total_amount),
      order.campus ?? undefined,
      order.payment_method ?? undefined,
      order.payment_reference ?? undefined
    );
  } else if (order.status === "pending") {
    const { customDeadlineIso } = await computeReservationExpiryMs(order);
    subject = `Encomenda ${order.order_number} - Aguardar Pagamento`;
    html = getPendingOrderEmailTemplate(
      order.order_number,
      order.customer_name ?? "Cliente",
      order.items,
      Number(order.total_amount),
      order.campus ?? undefined,
      order.payment_method ?? undefined,
      customDeadlineIso,
      undefined,
      isTicketOrder(order)
    );
  } else {
    html = getStatusUpdateOrderEmailTemplate(
      order.order_number,
      order.customer_name ?? "Cliente",
      order.status,
      statusLabel,
      order.campus ?? undefined,
      order.pickup_deadline ?? undefined
    );
  }

  const sent = await sendEmail({ to: order.customer_email, subject, html });
  return { success: Boolean(sent) };
}

export async function retryOrderEventHookAction(orderNumber: string): Promise<{
  success: boolean;
  message: string;
  processed: Array<{ item_id?: number; event_id: string; success: boolean }>;
}> {
  await requirePermission("orders:write");
  const order = await getOrderByNumber(orderNumber);
  if (!order) throw new Error("Order not found");
  if (!order.user_istid) throw new Error("Encomenda não possui IST ID de aluno associado");

  const ticketItems = (order.items || []).filter((item) => Boolean(item.event_id));
  if (ticketItems.length === 0) throw new Error("A encomenda não contém bilhetes de evento");

  const results = [];
  for (const item of ticketItems) {
    if (item.event_id) {
      await signUpToEvent(item.event_id, order.user_istid, order.order_number);
      results.push({ item_id: item.id, event_id: item.event_id, success: true });
    }
  }

  return {
    success: true,
    message: `Hook de evento reprocessado com sucesso para ${results.length} bilhete(s)`,
    processed: results,
  };
}

export async function settlePosOrderAction(payload: {
  orderNumber: string;
  paymentReference?: string | null;
  paymentMethod: PaymentMethod;
  shiftId?: string | null;
}): Promise<Order> {
  const res = await settlePosOrdersBatchAction({
    orderNumbers: [payload.orderNumber],
    paymentReference: payload.paymentReference,
    paymentMethod: payload.paymentMethod,
    shiftId: payload.shiftId,
  });

  const updated = res.orders?.[0] ?? (await getOrderByNumber(payload.orderNumber));
  if (!updated) throw new Error("Order not found after settlement");
  return updated;
}

export async function settlePosOrdersBatchAction(payload: {
  orderNumbers: string[];
  paymentReference?: string | null;
  paymentMethod: PaymentMethod;
  shiftId?: string | null;
}): Promise<{ success: boolean; orders: Order[] }> {
  const session = await requireUser();
  const canWrite = hasPermission(session.user, "orders:write");
  const canPos = hasPermission(session.user, "pos:access");
  if (!canWrite && !canPos) throw new Error("Forbidden: orders:write or pos:access required");

  if (!isPaymentMethodAllowedForChannel("pos", payload.paymentMethod))
    throw new Error("Invalid payment method for POS");

  const result = await finalizePaidOrders({
    orderNumbers: payload.orderNumbers,
    paymentReference: payload.paymentReference,
    paymentCheckedBy: session.user.istid,
    paymentMethod: payload.paymentMethod,
    shiftId: payload.shiftId ?? null,
  });

  if (!result.success) throw new Error(result.error || "Failed to settle batch POS orders");

  revalidateTag("orders", "max");
  for (const num of payload.orderNumbers) {
    revalidateTag(`order-${num}`, "max");
  }
  revalidatePath("/orders");
  revalidatePath("/[locale]/orders", "page");
  revalidatePath("/my-orders");
  revalidatePath("/[locale]/my-orders", "page");
  return { success: true, orders: result.orders || [] };
}

export async function sendCustomOrderEmailAction(payload: {
  orderNumbers: string[];
  subject: string;
  body: string;
}): Promise<{ success: boolean; sentCount: number }> {
  await requirePermission("orders:write");

  let sentCount = 0;
  const uniqueOrderNumbers = [...new Set(payload.orderNumbers)];

  for (const orderNum of uniqueOrderNumbers) {
    const order = await getOrderByNumber(orderNum);
    if (!order || !order.customer_email) continue;

    const vars: Record<string, string> = {
      name: order.customer_name || "Cliente",
      order_number: order.order_number,
      total: `${Number(order.total_amount).toFixed(2)}€`,
      status: order.status,
      campus: order.campus || "",
      email: order.customer_email,
    };

    const subject = interpolateEmailVariables(payload.subject, vars);
    const html = renderEmailMarkdownToHtml(payload.body, vars);

    const sent = await sendEmail({
      to: order.customer_email,
      subject,
      html,
    });

    if (sent) sentCount++;
  }

  return { success: true, sentCount };
}
