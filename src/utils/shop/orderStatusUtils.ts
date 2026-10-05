import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/types/shop/orderStatus";

export function getStatusLabel(status: OrderStatus): string {
  const label = ORDER_STATUS_CONFIG[status]?.label;
  if (typeof label === "function") return status;

  return label || status;
}

export function getStatusCssClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.cssClass || "";
}
