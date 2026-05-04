import type { PaymentMethod } from "@/types/shop/payment";
import type { OrderStatus } from "@/types/shop/orderStatus";
import type { OrderStatusConfig } from "@/types/shop/orderStatus";
import { Order } from "./order";

export const SPECIAL_CATEGORIES = ["Churrasco", "Jantar de Curso"] as const;

export type OrderKind = "normal" | "churrasco" | "jantar_de_curso";
export type OrderSource = "dinner" | "pos" | "mobile-pos" | "other";
export type OrderEmailTemplateType = "pending" | "paid" | "cancelled_auto" | "status_update";
export type OrderEmailTemplateKey = "default" | "jantar_pending" | "jantar_paid";
export type AfterPurchaseAction = "register_jantar_de_curso";
export type OrderProgressStepKey = OrderStatus | "confirmed";
export type StatusLabel = string | ((_order: Order) => string);

export interface OrderProgressStep {
  key: OrderProgressStepKey;
  label: StatusLabel;
  activeStatuses: readonly OrderStatus[];
}

interface SpecialOrderConfig {
  allowedSources: readonly OrderSource[];
  paymentMethods: readonly PaymentMethod[];
  paymentMethodsBySource?: Partial<Record<OrderSource, readonly PaymentMethod[]>>;
  customerEmailsEnabled?: boolean;
  emailTemplates?: Partial<
    Record<OrderEmailTemplateType, Exclude<OrderEmailTemplateKey, "default">>
  >;
  requiresUserAssignment?: boolean;
  autoCancelEnabled?: boolean;
  afterPurchaseAction?: AfterPurchaseAction;
  statusOverrides?: Partial<Record<OrderStatus, Partial<OrderStatusConfig>>>;
}

export interface OrderKindRules {
  allowedSources: readonly OrderSource[];
  paymentMethods: readonly PaymentMethod[];
  customerEmailsEnabled: boolean;
  requiresUserAssignment: boolean;
  autoCancelEnabled: boolean;
  emailTemplates: Record<OrderEmailTemplateType, OrderEmailTemplateKey>;
  afterPurchaseActionKey?: AfterPurchaseAction;
  statusOverrides?: Partial<Record<OrderStatus, Partial<OrderStatusConfig>>>;
}

export const SPECIAL_ORDER_CONFIG: Record<Exclude<OrderKind, "normal">, SpecialOrderConfig> = {
  churrasco: {
    allowedSources: ["mobile-pos"],
    paymentMethods: ["cash", "sumup-tpa", "other"],
    customerEmailsEnabled: false,
    requiresUserAssignment: false,
    autoCancelEnabled: false,
  },
  jantar_de_curso: {
    allowedSources: ["dinner", "pos"],
    paymentMethods: ["in-person", "mbway", "cash", "other"],
    paymentMethodsBySource: {
      dinner: ["in-person", "mbway"],
      pos: ["in-person", "cash", "other", "mbway"],
    },
    emailTemplates: {
      pending: "jantar_pending",
      paid: "jantar_paid",
    },
    afterPurchaseAction: "register_jantar_de_curso",
    statusOverrides: {
      pending: {
        label: (order: Order) =>
          order.payment_method === "mbway" ? "Pagamento MB Way em verificação" : "Pendente",
        allowedTransitions: ["paid", "cancelled"],
      },
      paid: {
        label: "Confirmado",
        allowedTransitions: ["cancelled"],
      },
      ready: {
        visibleInProgress: false,
      },
      delivered: {
        visibleInProgress: false,
      },
    },
  },
};
