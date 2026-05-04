import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
  type OrderStatusConfig,
} from "@/types/shop/orderStatus";

export function getStatusConfig(status: OrderStatus): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status];
}

export function getStatusLabel(status: OrderStatus): string {
  const label = ORDER_STATUS_CONFIG[status]?.label;
  if (typeof label === "function") return status;

  return label || status;
}

export function getStatusCssClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.cssClass || "";
}

export function getProgressPercentage(status: OrderStatus): number {
  return ORDER_STATUS_CONFIG[status]?.progressStep || 0;
}

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return ORDER_STATUS_CONFIG[currentStatus]?.allowedTransitions.includes(targetStatus) || false;
}

export function getProgressStepClass(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus
): "active" | "inactive" {
  const currentStep = ORDER_STATUS_CONFIG[currentStatus]?.progressStep || 0;
  const targetStep = ORDER_STATUS_CONFIG[stepStatus]?.progressStep || 0;

  return targetStep <= currentStep ? "active" : "inactive";
}
