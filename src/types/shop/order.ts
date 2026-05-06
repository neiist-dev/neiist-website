import type { PaymentMethod } from "@/types/shop/payment";
import { decodeVariantOptionsFromStorage } from "@/types/shop/product";
import type { OrderStatus } from "@/types/shop/orderStatus";

export enum Campus {
  _Alameda = "alameda",
  _Taguspark = "taguspark",
}

export interface Order {
  id: number;
  order_number: string;
  mbway_number?: string | null;
  customer_name: string;
  user_istid?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_nif?: string;
  campus?: string;
  pickup_deadline?: string | null;
  items: OrderItem[];
  notes?: string;
  total_amount: number;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  created_by?: string;
  created_at: string;
  paid_at?: string;
  payment_checked_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  updated_at?: string;
  updated_by?: string;
  status: OrderStatus;
}

export interface dbOrder {
  id: number;
  order_number: string;
  customer_name: string;
  user_istid: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_nif: string | null;
  campus: string | null;
  pickup_deadline: string | null;
  items: dbOrderItem[] | null;
  notes: string | null;
  total_amount: string | number;
  payment_method: string | null;
  payment_reference: string | null;
  created_by: string | null;
  created_at: string;
  paid_at: string | null;
  payment_checked_by: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  status: string;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_label?: string;
  variant_options?: Record<string, string>;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface dbOrderItem {
  product_id: number;
  product_name: string;
  variant_id: number | null;
  variant_label: string | null;
  variant_options: Record<string, string> | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

export function mapdbOrderToOrder(row: dbOrder): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_name: row.customer_name ?? "",
    user_istid: row.user_istid ?? undefined,
    customer_email: row.customer_email ?? undefined,
    customer_phone: row.customer_phone ?? undefined,
    customer_nif: row.customer_nif ?? undefined,
    campus: row.campus ?? undefined,
    pickup_deadline: row.pickup_deadline ?? undefined,
    items: (row.items ?? []).map(
      (item): OrderItem => ({
        product_id: item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id ?? undefined,
        variant_label: item.variant_label ?? undefined,
        variant_options: decodeVariantOptionsFromStorage(item.variant_options ?? undefined),
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })
    ),
    notes: row.notes ?? undefined,
    total_amount: Number(row.total_amount),
    payment_method: (row.payment_method as PaymentMethod) ?? undefined,
    payment_reference: row.payment_reference ?? undefined,
    created_by: row.created_by ?? undefined,
    created_at: row.created_at,
    paid_at: row.paid_at ?? undefined,
    payment_checked_by: row.payment_checked_by ?? undefined,
    delivered_at: row.delivered_at ?? undefined,
    delivered_by: row.delivered_by ?? undefined,
    updated_at: row.updated_at ?? undefined,
    updated_by: row.updated_by ?? undefined,
    status: row.status as Order["status"],
  };
}
