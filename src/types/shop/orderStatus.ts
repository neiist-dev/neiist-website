export type OrderStatus = "pending" | "paid" | "ready" | "delivered" | "cancelled";

export interface OrderStatusConfig {
  label: string;
  cssClass: string;
  progressStep: number;
  allowedTransitions: OrderStatus[];
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    label: "Pendente",
    cssClass: "statusPendente",
    progressStep: 0,
    allowedTransitions: ["paid", "cancelled"],
  },
  paid: {
    label: "Pago",
    cssClass: "statusPago",
    progressStep: 33.33,
    allowedTransitions: ["ready", "delivered", "cancelled"],
  },
  ready: {
    label: "Pronto",
    cssClass: "statusPronto",
    progressStep: 66.66,
    allowedTransitions: ["delivered", "cancelled"],
  },
  delivered: {
    label: "Entregue",
    cssClass: "statusEntregue",
    progressStep: 100,
    allowedTransitions: [],
  },
  cancelled: {
    label: "Cancelado",
    cssClass: "statusCancelled",
    progressStep: 0,
    allowedTransitions: [],
  },
} as const;
