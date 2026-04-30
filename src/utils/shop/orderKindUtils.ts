import {
  SPECIAL_ORDER_CONFIG,
  type OrderKind,
  type OrderSource,
  type OrderKindRules,
  type OrderProgressStep,
} from "@/types/shop/orderKind";
import { POS_PAYMENT_METHODS, type PaymentMethod } from "@/types/shop/payment";
import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/types/shop/orderStatus";

const ORDER_KIND_BY_CATEGORY: Record<string, Exclude<OrderKind, "normal">> = {
  churrasco: "churrasco",
  "jantar de curso": "jantar_de_curso",
};

const DEFAULT_ORDER_RULES: Omit<OrderKindRules, "paymentMethods"> = {
  allowedSources: ["dinner", "pos", "mobile-pos", "other"],
  customerEmailsEnabled: true,
  requiresUserAssignment: true,
  autoCancelEnabled: true,
  emailTemplates: {
    pending: "default",
    paid: "default",
    cancelled_auto: "default",
    status_update: "default",
  },
};

function getOrderKindFromName(productName?: string | null): OrderKind {
  const normalizedName = productName?.trim().toLowerCase() ?? "";
  if (normalizedName.includes("churrasco")) return "churrasco";
  if (normalizedName.includes("jantar de curso")) return "jantar_de_curso";

  return "normal";
}

export function getOrderKindFromCategory(category?: string | null): OrderKind {
  const normalizedCategory = category?.trim().toLowerCase() ?? "";
  return ORDER_KIND_BY_CATEGORY[normalizedCategory] ?? "normal";
}

export function isSpecialCategory(category?: string | null): boolean {
  return getOrderKindFromCategory(category) !== "normal";
}

export function isChurrascoCategory(category?: string | null): boolean {
  return getOrderKindFromCategory(category) === "churrasco";
}

export function isJantarDeCursoCategory(category?: string | null): boolean {
  return getOrderKindFromCategory(category) === "jantar_de_curso";
}

export function getOrderKindRules(
  orderKind: OrderKind,
  source: OrderSource = "other"
): OrderKindRules {
  const specialConfig = orderKind === "normal" ? undefined : SPECIAL_ORDER_CONFIG[orderKind];

  const defaultPaymentMethods: readonly PaymentMethod[] =
    source === "pos" || source === "mobile-pos" ? POS_PAYMENT_METHODS : ["sumup", "in-person"];
  const paymentMethods =
    specialConfig?.paymentMethodsBySource?.[source] ??
    specialConfig?.paymentMethods ??
    defaultPaymentMethods;

  return {
    allowedSources: specialConfig?.allowedSources ?? DEFAULT_ORDER_RULES.allowedSources,
    paymentMethods,
    customerEmailsEnabled:
      specialConfig?.customerEmailsEnabled ?? DEFAULT_ORDER_RULES.customerEmailsEnabled,
    requiresUserAssignment:
      specialConfig?.requiresUserAssignment ?? DEFAULT_ORDER_RULES.requiresUserAssignment,
    autoCancelEnabled: specialConfig?.autoCancelEnabled ?? DEFAULT_ORDER_RULES.autoCancelEnabled,
    emailTemplates: {
      ...DEFAULT_ORDER_RULES.emailTemplates,
      ...specialConfig?.emailTemplates,
    },
    afterPurchaseActionKey: specialConfig?.afterPurchaseAction,
    progressSteps: specialConfig?.progressSteps,
  };
}

export function getOrderProgressSteps(orderKind: OrderKind): readonly OrderProgressStep[] {
  const orderRules = getOrderKindRules(orderKind);
  if (orderRules.progressSteps && orderRules.progressSteps.length > 0) {
    return orderRules.progressSteps;
  }

  const defaultProgressStatuses: readonly OrderStatus[] = ["pending", "paid", "ready", "delivered"];

  return defaultProgressStatuses.map((status, index, statuses) => ({
    key: status,
    label: ORDER_STATUS_CONFIG[status].label,
    activeStatuses: statuses.slice(index),
  }));
}

export function getOrderKindFromItems(
  items: Array<{ product_name?: string | null; category?: string | null }> = []
): { orderKind: OrderKind; isMixedInvalid: boolean } {
  const detectedKinds = new Set<OrderKind>(
    items.map((item) => {
      const categoryKind = getOrderKindFromCategory(item.category);
      return categoryKind === "normal" ? getOrderKindFromName(item.product_name) : categoryKind;
    })
  );

  const specialKinds = [...detectedKinds].filter(
    (kind): kind is Exclude<OrderKind, "normal"> => kind !== "normal"
  );

  if (specialKinds.length === 0) return { orderKind: "normal", isMixedInvalid: false };

  if (specialKinds.length > 1 || detectedKinds.has("normal")) {
    return { orderKind: specialKinds[0], isMixedInvalid: true };
  }

  return { orderKind: specialKinds[0], isMixedInvalid: false };
}
