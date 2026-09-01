export const PAYMENT_METHODS = [
  "cash",
  "sumup-tpa",
  "sumup",
  "apple-pay",
  "in-person",
  "mbway",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHODS_SET: ReadonlySet<string> = new Set(PAYMENT_METHODS);

export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && PAYMENT_METHODS_SET.has(value);
}

export type PaymentMethodDict = Record<PaymentMethod, string>;

export function getPaymentLabel(method: PaymentMethod, dict?: PaymentMethodDict): string {
  if (dict && dict[method]) {
    return dict[method];
  }
  return method;
}

export function getLocalizedPaymentMethods(
  methods: ReadonlyArray<PaymentMethod>,
  dict?: PaymentMethodDict
): Array<{ id: PaymentMethod; label: string }> {
  return methods.map((method) => ({
    id: method,
    label: getPaymentLabel(method, dict),
  }));
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
