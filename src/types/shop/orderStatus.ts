export type OrderStatus = "pending" | "paid" | "ready" | "delivered" | "cancelled";

export interface OrderStatusDict {
  status: Record<OrderStatus, string>;
  delivered_on?: string;
  special_status?: {
    jantar_confirmed: string;
  };
}

export interface OrderStatusConfig {
  cssClass: string;
  progressStep: number;
  allowedTransitions: OrderStatus[];
  visibleInProgress?: boolean;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    cssClass: "statusPendente",
    progressStep: 0,
    allowedTransitions: ["paid", "cancelled"],
  },
  paid: {
    cssClass: "statusPago",
    progressStep: 33.33,
    allowedTransitions: ["ready", "delivered", "cancelled"],
  },
  ready: {
    cssClass: "statusPronto",
    progressStep: 66.66,
    allowedTransitions: ["delivered", "cancelled"],
  },
  delivered: {
    cssClass: "statusEntregue",
    progressStep: 100,
    allowedTransitions: [],
  },
  cancelled: {
    cssClass: "statusCancelled",
    progressStep: 0,
    allowedTransitions: [],
  },
} as const;
