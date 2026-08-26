export const PAYMENT_METHODS = {
  cash: { label: "Numerário" },
  "sumup-tpa": { label: "SumUp TPA" },
  sumup: { label: "SumUp Card Online" },
  "apple-pay": { label: "SumUp Apple Pay" },
  "in-person": { label: "Em pessoa" },
  mbway: { label: "MBWay" },
  other: { label: "Outro" },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export function getPaymentLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS[method]?.label ?? method;
}

export const ONLINE_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = ["sumup", "apple-pay"];

export const PENDING_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set(["in-person", "mbway"]);

export const DEFAULT_SHOP_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = [
  "sumup",
  "in-person",
  "mbway",
  "apple-pay",
];

export const POS_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = [
  "cash",
  "sumup-tpa",
  "mbway",
  "other",
];
