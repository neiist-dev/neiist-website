import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
  type OrderStatusDict,
} from "@/types/shop/orderStatus";
import type { Order } from "@/types/shop/order";

export function getStatusLabel(
  status: OrderStatus,
  dict: Record<OrderStatus, string>,
  options?: { isTicket?: boolean; ticketConfirmedLabel?: string }
): string {
  if (options?.isTicket && status === "paid" && options.ticketConfirmedLabel) {
    return options.ticketConfirmedLabel;
  }
  return dict[status];
}

export function isTicketOrderItem(item: {
  product_type?: string | null;
  event_id?: string | null;
  event_hook?: string | null;
}): boolean {
  return item.product_type === "event_ticket" || Boolean(item.event_id) || Boolean(item.event_hook);
}

export function isTicketOrder(order: {
  items?: Array<{
    product_type?: string | null;
    event_id?: string | null;
    event_hook?: string | null;
  }>;
}): boolean {
  return Boolean(order.items?.some(isTicketOrderItem));
}

export function getAllowedOrderStatusTransitions(
  currentStatus: OrderStatus,
  isTicket: boolean = false
): readonly OrderStatus[] {
  if (isTicket) {
    if (currentStatus === "pending") return ["paid", "cancelled"];
    if (currentStatus === "paid") return ["cancelled"];
    return [];
  }
  return ORDER_STATUS_CONFIG[currentStatus].allowedTransitions;
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  isTicket: boolean = false
): boolean {
  return getAllowedOrderStatusTransitions(currentStatus, isTicket).includes(targetStatus);
}

export function isReservationOrder(order: Pick<Order, "status" | "payments">): boolean {
  return order.status === "pending" && (!order.payments || order.payments.length === 0);
}

export function isSettledOrderStatus(status: OrderStatus): boolean {
  return status === "paid" || status === "ready" || status === "delivered";
}

export function isCashPayment(method: string | null | undefined): boolean {
  return method === "cash";
}

export function getLocalizedOrderStatusLabel(order: Order, dict: OrderStatusDict): string {
  if (order.delivered_at && dict.delivered_on)
    return dict.delivered_on.replace("{date}", new Date(order.delivered_at).toLocaleDateString());

  if (isTicketOrder(order) && order.status === "paid" && dict.ticket_confirmed)
    return dict.ticket_confirmed;

  return dict.status[order.status];
}
