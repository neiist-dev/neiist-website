export const PAYMENT_METHODS = {
  cash: { label: "Cash" },
  "sumup-tpa": { label: "SumUp TPA" },
  sumup: { label: "SumUp Card Online" },
  "apple-pay": { label: "SumUp Apple Pay" },
  "in-person": { label: "Em pessoa" },
  other: { label: "Outro" },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export function getPaymentLabel(method: PaymentMethod) {
  return PAYMENT_METHODS[method].label;
}

export const PENDING_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set([
  "in-person",
  "cash",
  "other",
]);

export const POS_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = ["cash", "other", "sumup-tpa"];

export const ONLINE_PAYMENT_METHODS: ReadonlyArray<PaymentMethod> = [
  "in-person",
  "sumup",
  "apple-pay",
];
