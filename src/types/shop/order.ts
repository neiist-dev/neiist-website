import {
  dbPayment,
  DbPaymentMethod,
  fromDbPaymentMethod,
  mapdbPaymentToPayment,
  PaymentMethod,
  PaymentRecord,
} from "@/types/shop/payment";
import { OrderStatus } from "@/types/shop/orderStatus";
import { decodeVariantOptionsFromStorage } from "@/utils/shop/shopUtils";
import { parseDbNumeric } from "@/utils/shop/moneyUtils";

export enum Campus {
  _Alameda = "alameda",
  _Taguspark = "taguspark",
}

export type OrderSource = "web" | "pos" | "fast-pos";

export interface OrderItem {
  id?: number;
  order_number?: string;
  product_id: number;
  product_name: string;
  product_type?: string;
  event_id?: string;
  event_hook?: string;
  variant_id?: number | null;
  variant_label?: string;
  variant_options?: Record<string, string>;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  deliver_now?: boolean;
  delivered_at?: string | null;
  delivered_by?: string | null;
}

export interface CreateOrderItemInput {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  deliver_now?: boolean;
}

export interface CreateOrderPaymentInput {
  method: PaymentMethod;
  shift_id?: string | null;
  amount?: number;
  status?: "pending" | "successful";
  received_by?: string | null;
  reference?: string | null;
}

export interface CreateOrderInput {
  order_number?: string;
  order_source?: OrderSource;
  user_istid?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_nif?: string | null;
  campus?: string | null;
  notes?: string | null;
  discount_code?: string | null;
  created_by?: string | null;
  stock_override?: boolean;
  items: Array<CreateOrderItemInput | OrderItem>;
  payment?: CreateOrderPaymentInput | null;
}

export interface dbOrderItem {
  id?: number;
  order_number?: string;
  product_id: number | null;
  product_name: string;
  product_type?: string | null;
  event_id?: string | null;
  event_hook?: string | null;
  variant_id: number | null;
  variant_label: string | null;
  variant_options: Record<string, string> | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  status?: string;
  stock_decremented?: number;
  delivered_at?: string | null;
  delivered_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  order_number: string;
  customer_name: string;
  user_istid?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_nif?: string;
  campus?: string;
  pickup_deadline?: string | null;
  items: OrderItem[];
  payments?: PaymentRecord[];
  notes?: string;
  discount_code?: string;
  discount_amount?: number;
  total_amount: number;
  order_source?: OrderSource;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  paid_at?: string;
  payment_checked_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  status: OrderStatus;
}

export interface dbOrder {
  order_number: string;
  customer_name: string | null;
  user_istid: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_nif: string | null;
  campus: string | null;
  pickup_deadline: string | null;
  items: dbOrderItem[] | null;
  payments?: dbPayment[] | null;
  notes: string | null;
  discount_code: string | null;
  discount_amount: string | number | null;
  total_amount: string | number;
  order_source?: string | null;
  payment_method?: DbPaymentMethod | null;
  payment_reference?: string | null;
  paid_at?: string | null;
  payment_checked_by?: string | null;
  delivered_at?: string | null;
  delivered_by?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  status: string;
}

export function mapdbOrderItemToOrderItem(
  item: dbOrderItem,
  fallbackOrderNumber?: string
): OrderItem {
  return {
    id: item.id,
    order_number: item.order_number ?? fallbackOrderNumber,
    product_id: item.product_id ?? 0,
    product_name: item.product_name,
    product_type: item.product_type ?? undefined,
    event_id: item.event_id ?? undefined,
    event_hook: item.event_hook ?? undefined,
    variant_id: item.variant_id ?? undefined,
    variant_label: item.variant_label ?? undefined,
    variant_options: decodeVariantOptionsFromStorage(item.variant_options),
    quantity: item.quantity,
    unit_price: parseDbNumeric(item.unit_price),
    total_price: parseDbNumeric(item.total_price),
    status: (item.status as OrderStatus) || "pending",
    delivered_at: item.delivered_at ?? undefined,
    delivered_by: item.delivered_by ?? undefined,
  };
}

export function mapdbOrderToOrder(row: dbOrder): Order {
  const items: OrderItem[] = (row.items ?? []).map((item) =>
    mapdbOrderItemToOrderItem(item, row.order_number)
  );

  const payments: PaymentRecord[] | undefined = row.payments
    ? row.payments.map(mapdbPaymentToPayment)
    : undefined;

  const latestPayment = payments && payments.length > 0 ? payments[payments.length - 1] : undefined;

  return {
    order_number: row.order_number,
    customer_name: row.customer_name ?? "",
    user_istid: row.user_istid ?? undefined,
    customer_email: row.customer_email ?? undefined,
    customer_phone: row.customer_phone ?? undefined,
    customer_nif: row.customer_nif ?? undefined,
    campus: row.campus ?? undefined,
    pickup_deadline: row.pickup_deadline ?? undefined,
    items,
    payments,
    notes: row.notes ?? undefined,
    discount_code: row.discount_code ?? undefined,
    discount_amount:
      row.discount_amount !== null && row.discount_amount !== undefined
        ? parseDbNumeric(row.discount_amount)
        : undefined,
    total_amount: parseDbNumeric(row.total_amount),
    order_source: (row.order_source as OrderSource) ?? undefined,
    payment_method: row.payment_method
      ? fromDbPaymentMethod(row.payment_method)
      : latestPayment?.method,
    payment_reference: row.payment_reference ?? latestPayment?.reference ?? undefined,
    paid_at: row.paid_at ?? latestPayment?.paid_at ?? undefined,
    payment_checked_by: row.payment_checked_by ?? latestPayment?.received_by ?? undefined,
    delivered_at: row.delivered_at ?? undefined,
    delivered_by: row.delivered_by ?? undefined,
    created_by: row.created_by ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at ?? undefined,
    updated_by: row.updated_by ?? undefined,
    status: row.status as OrderStatus,
  };
}
