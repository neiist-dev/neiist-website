import type { OrderSource } from "@/types/shop/order";
import { parseDbNumeric } from "@/utils/shop/moneyUtils";

export const PAYMENT_METHODS = [
  "cash",
  "sumup-tpa",
  "sumup",
  "apple-pay",
  "mbway",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);

/**
 * Provider-independent payment methods persisted by PostgreSQL.
 */
export const DB_PAYMENT_METHODS = [
  "cash",
  "tpa",
  "card-online",
  "instant-transfer",
  "other",
] as const;

export type DbPaymentMethod = (typeof DB_PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_TO_DB = {
  cash: "cash",
  "sumup-tpa": "tpa",
  sumup: "card-online",
  "apple-pay": "card-online",
  mbway: "instant-transfer",
  other: "other",
} as const satisfies Record<PaymentMethod, DbPaymentMethod>;

export const DB_PAYMENT_METHOD_TO_APP = {
  cash: "cash",
  tpa: "sumup-tpa",
  "card-online": "sumup",
  "instant-transfer": "mbway",
  other: "other",
} as const satisfies Record<DbPaymentMethod, PaymentMethod>;

export function toDbPaymentMethod(method: PaymentMethod): DbPaymentMethod {
  return PAYMENT_METHOD_TO_DB[method];
}

export function fromDbPaymentMethod(method: DbPaymentMethod): PaymentMethod {
  return DB_PAYMENT_METHOD_TO_APP[method];
}

/**
 * "In-person" option is not a payment method but a state
 * */
export const RESERVATION = "reservation" as const;
export type CheckoutChoice = PaymentMethod | typeof RESERVATION;

export const ONLINE_PAYMENT_METHODS = [
  "sumup",
  "apple-pay",
  "mbway",
] as const satisfies ReadonlyArray<PaymentMethod>;

export const POS_PAYMENT_METHODS = [
  "cash",
  "sumup-tpa",
  "mbway",
  "other",
] as const satisfies ReadonlyArray<PaymentMethod>;

export const FAST_POS_PAYMENT_METHODS = [
  "cash",
  "sumup-tpa",
  "mbway",
] as const satisfies ReadonlyArray<PaymentMethod>;

/**
 * Purchase channel owns the payment methods that can be used in it
 */
export const PAYMENT_METHODS_BY_CHANNEL = {
  web: ONLINE_PAYMENT_METHODS,
  pos: POS_PAYMENT_METHODS,
  "fast-pos": FAST_POS_PAYMENT_METHODS,
} as const satisfies Record<OrderSource, ReadonlyArray<PaymentMethod>>;

export function isPaymentMethodAllowedForChannel(
  channel: OrderSource,
  method: PaymentMethod
): boolean {
  const allowed: ReadonlyArray<PaymentMethod> = PAYMENT_METHODS_BY_CHANNEL[channel];
  return allowed.includes(method);
}

export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export interface PaymentRecord {
  id: number;
  order_number: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference?: string | null;
  paid_at?: string | null;
  received_by?: string | null;
  shift_id?: string | null;
  created_at: string;
}

export interface dbPayment {
  id: number;
  order_number: string;
  method: DbPaymentMethod;
  amount: string | number;
  status: string;
  reference: string | null;
  paid_at: string | null;
  received_by: string | null;
  shift_id: string | null;
  created_at: string;
}

export function mapdbPaymentToPayment(row: dbPayment): PaymentRecord {
  return {
    id: row.id,
    order_number: row.order_number,
    method: fromDbPaymentMethod(row.method),
    amount: parseDbNumeric(row.amount),
    status: row.status as PaymentStatus,
    reference: row.reference ?? null,
    paid_at: row.paid_at ?? null,
    received_by: row.received_by ?? null,
    shift_id: row.shift_id ?? null,
    created_at: row.created_at,
  };
}
