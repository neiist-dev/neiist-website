export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  size?: string;
  stock_type: "limited" | "on_demand";
  stock_quantity?: number;
  order_deadline?: string;
  estimated_delivery?: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  variant_name: string;
  variant_value: string;
  images?: string[];
  price_modifier: number;
  stock_quantity?: number;
  size?: string;
  active: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  user_istid?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_nif?: string;
  campus?: string;
  items: OrderItem[];
  notes?: string;
  total_amount: number;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  paid_at?: string;
  paid_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  updated_at?: string;
  status: OrderStatus;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_info?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "delivered" | "cancelled";

export interface DbProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  variant_value: string;
  images?: string[] | null;
  price_modifier: number | string | null;
  stock_quantity?: number | null;
  size?: string | null;
  active: boolean;
}

export interface DbProduct {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  images: string[] | null;
  category: string | null;
  size: string | null;
  stock_type: string;
  stock_quantity: number | null;
  order_deadline: string | null;
  estimated_delivery: string | null;
  variants: DbProductVariant[] | null;
}

export interface DbOrderItem {
  product_id: number;
  product_name: string;
  variant_id: number | null;
  variant_info: string | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

export interface DbOrder {
  id: number;
  order_number: string;
  customer_name: string;
  user_istid: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_nif: string | null;
  campus: string | null;
  items: DbOrderItem[] | null;
  notes: string | null;
  total_amount: string | number;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  paid_at: string | null;
  paid_by: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  updated_at: string | null;
  status: string;
}

export function mapDbProductToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    images: row.images ?? [],
    category: row.category ?? undefined,
    size: row.size ?? undefined,
    stock_type: row.stock_type as Product["stock_type"],
    stock_quantity: row.stock_quantity ?? undefined,
    order_deadline: row.order_deadline ?? undefined,
    estimated_delivery: row.estimated_delivery ?? undefined,
    variants: (row.variants ?? []).map(
      (v): ProductVariant => ({
        id: v.id,
        variant_name: v.variant_name,
        variant_value: v.variant_value,
        images: v.images ?? [],
        price_modifier: Number(v.price_modifier ?? 0),
        stock_quantity: v.stock_quantity ?? undefined,
        size: v.size ?? undefined,
        active: Boolean(v.active),
      })
    ),
  };
}

export function mapDbOrderToOrder(row: DbOrder): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer_name: row.customer_name ?? "",
    user_istid: row.user_istid ?? undefined,
    customer_email: row.customer_email ?? undefined,
    customer_phone: row.customer_phone ?? undefined,
    customer_nif: row.customer_nif ?? undefined,
    campus: row.campus ?? undefined,
    items: (row.items ?? []).map(
      (it): OrderItem => ({
        product_id: it.product_id,
        product_name: it.product_name,
        variant_id: it.variant_id ?? undefined,
        variant_info: it.variant_info ?? undefined,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        total_price: Number(it.total_price),
      })
    ),
    notes: row.notes ?? undefined,
    total_amount: Number(row.total_amount),
    payment_method: row.payment_method ?? undefined,
    payment_reference: row.payment_reference ?? undefined,
    created_at: row.created_at,
    paid_at: row.paid_at ?? undefined,
    paid_by: row.paid_by ?? undefined,
    delivered_at: row.delivered_at ?? undefined,
    delivered_by: row.delivered_by ?? undefined,
    updated_at: row.updated_at ?? undefined,
    status: row.status as Order["status"],
  };
}
