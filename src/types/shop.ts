export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  stock_type: "limited" | "on_demand";
  stock_quantity?: number;
  order_deadline?: string;
  variants: ProductVariant[];
}

export interface dbProduct {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  images: string[] | null;
  category: string | null;
  stock_type: string;
  stock_quantity: number | null;
  order_deadline: string | null;
  variants: dbProductVariant[] | null;
}

export interface ProductVariant {
  id: number;
  sku?: string;
  images?: string[];
  price_modifier: number;
  stock_quantity?: number;
  active: boolean;
  options: Record<string, string>;
  label?: string;
}

export interface dbProductVariant {
  id: number;
  product_id?: number | null;
  sku: string | null;
  images: string[] | null;
  price_modifier: number | string | null;
  stock_quantity: number | null;
  active: boolean;
  options: Record<string, string> | null;
  label: string | null;
}

export type PaymentMethod = "in-person" | "eupago" | "sumup";

export enum Campus {
  _Alameda = "alameda",
  _Taguspark = "taguspark",
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
  payment_method?: PaymentMethod;
  payment_reference?: string;
  created_at: string;
  paid_at?: string;
  payment_checked_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  updated_at?: string;
  status: OrderStatus;
}

export type OrderStatus = "pending" | "paid" | "ready" | "delivered" | "cancelled";

export interface OrderStatusConfig {
  label: string;
  cssClass: string;
  progressStep: number;
  allowedTransitions: OrderStatus[];
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    label: "Pendente",
    cssClass: "statusPendente",
    progressStep: 0,
    allowedTransitions: ["paid", "cancelled"],
  },
  paid: {
    label: "Pago",
    cssClass: "statusPago",
    progressStep: 33.33,
    allowedTransitions: ["ready", "delivered", "cancelled"],
  },
  ready: {
    label: "Pronto",
    cssClass: "statusPronto",
    progressStep: 66.66,
    allowedTransitions: ["delivered", "cancelled"],
  },
  delivered: {
    label: "Entregue",
    cssClass: "statusEntregue",
    progressStep: 100,
    allowedTransitions: [],
  },
  cancelled: {
    label: "Cancelado",
    cssClass: "statusCancelled",
    progressStep: 0,
    allowedTransitions: [],
  },
} as const;

export interface dbOrder {
  id: number;
  order_number: string;
  customer_name: string;
  user_istid: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_nif: string | null;
  campus: string | null;
  items: dbOrderItem[] | null;
  notes: string | null;
  total_amount: string | number;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
  paid_at: string | null;
  payment_checked_by: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  updated_at: string | null;
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

export interface Category {
  id: number;
  name: string;
}

export interface dbCategory {
  category_id: number;
  category_name: string;
}

export interface CartItem {
  product: Product;
  variantId?: number;
  quantity: number;
}

export function getStatusConfig(status: OrderStatus): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status];
}

export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.label || status;
}

export function getStatusCssClass(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status]?.cssClass || "";
}

export function getProgressPercentage(status: OrderStatus): number {
  return ORDER_STATUS_CONFIG[status]?.progressStep || 0;
}

export function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return ORDER_STATUS_CONFIG[currentStatus]?.allowedTransitions.includes(targetStatus) || false;
}

export function getProgressStepClass(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus
): "active" | "inactive" {
  const currentStep = ORDER_STATUS_CONFIG[currentStatus]?.progressStep || 0;
  const targetStep = ORDER_STATUS_CONFIG[stepStatus]?.progressStep || 0;

  return targetStep <= currentStep ? "active" : "inactive";
}

export function mapdbProductToProduct(row: dbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    images: row.images ?? [],
    category: row.category ?? undefined,
    stock_type: row.stock_type as Product["stock_type"],
    stock_quantity: row.stock_quantity ?? undefined,
    order_deadline: row.order_deadline ?? undefined,
    variants: (row.variants ?? []).map(
      (v): ProductVariant => ({
        id: v.id,
        sku: v.sku ?? undefined,
        images: v.images ?? undefined,
        price_modifier: Number(v.price_modifier ?? 0),
        stock_quantity: v.stock_quantity ?? undefined,
        active: Boolean(v.active),
        options: v.options ?? {},
        label: v.label ?? undefined,
      })
    ),
  };
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
    items: (row.items ?? []).map(
      (it): OrderItem => ({
        product_id: it.product_id,
        product_name: it.product_name,
        variant_id: it.variant_id ?? undefined,
        variant_label: it.variant_label ?? undefined,
        variant_options: it.variant_options ?? undefined,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        total_price: Number(it.total_price),
      })
    ),
    notes: row.notes ?? undefined,
    total_amount: Number(row.total_amount),
    payment_method: (row.payment_method as PaymentMethod) ?? undefined,
    payment_reference: row.payment_reference ?? undefined,
    created_at: row.created_at,
    paid_at: row.paid_at ?? undefined,
    payment_checked_by: row.payment_checked_by ?? undefined,
    delivered_at: row.delivered_at ?? undefined,
    delivered_by: row.delivered_by ?? undefined,
    updated_at: row.updated_at ?? undefined,
    status: row.status as Order["status"],
  };
}

export function mapdbCategoryToCategory(row: dbCategory): Category {
  return {
    id: row.category_id,
    name: row.category_name,
  };
}
