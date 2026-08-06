import type { PaymentLabelsDict } from "@/types/i18n";
export const PAYMENT_METHODS = {
  cash: { },
  "sumup-tpa": { },
  sumup: { },
  "apple-pay": { },
  "in-person": { },
  mbway: { },
  other: { },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export function getPaymentLabel(method: PaymentMethod, dict : PaymentLabelsDict): string {
  const map: Record<PaymentMethod, string> = {
    cash: dict.method_cash,
    "sumup-tpa": dict.method_sumup_tpa,
    sumup: dict.method_sumup,
    "apple-pay": dict.method_apple_pay,
    "in-person": dict.method_in_person,
    mbway: dict.method_mbway,
    other: dict.method_other,
  };
  return map[method];
}

export const PENDING_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set(["in-person", "mbway"]);

export const POS_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = ["cash", "other", "sumup-tpa"];

export const ONLINE_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = [
  "in-person",
  "mbway",
  "sumup",
  "apple-pay",
];
