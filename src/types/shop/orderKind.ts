import type { PaymentMethod } from "@/types/shop/payment";
import type { OrderStatus } from "@/types/shop/orderStatus";

export const SPECIAL_CATEGORIES = ["Churrasco", "Jantar de Curso"] as const;

export type OrderKind = "normal" | "churrasco" | "jantar_de_curso";
export type OrderSource = "dinner" | "pos" | "mobile-pos" | "other";
export type OrderEmailTemplateType = "pending" | "paid" | "cancelled_auto" | "status_update";
export type OrderEmailTemplateKey = "default" | "jantar_pending" | "jantar_paid";
export type AfterPurchaseAction = "register_jantar_de_curso";
export type OrderProgressStepKey = OrderStatus | "confirmed";

export interface OrderProgressStep {
  key: OrderProgressStepKey;
  label: string;
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
  progressSteps?: readonly OrderProgressStep[];
}

export interface OrderKindRules {
  allowedSources: readonly OrderSource[];
  paymentMethods: readonly PaymentMethod[];
  customerEmailsEnabled: boolean;
  requiresUserAssignment: boolean;
  autoCancelEnabled: boolean;
  emailTemplates: Record<OrderEmailTemplateType, OrderEmailTemplateKey>;
  afterPurchaseActionKey?: AfterPurchaseAction;
  progressSteps?: readonly OrderProgressStep[];
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
      pos: ["cash", "other", "mbway"],
    },
    emailTemplates: {
      pending: "jantar_pending",
      paid: "jantar_paid",
    },
    afterPurchaseAction: "register_jantar_de_curso",
    progressSteps: [
      {
        key: "pending",
        label: "Pendente",
        activeStatuses: ["pending", "paid"],
      },
      {
        key: "confirmed",
        label: "Confirmado",
        activeStatuses: ["paid"],
      },
    ],
  },
};
