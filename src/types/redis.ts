import type {
  OrderItem,
  CreateOrderItemInput,
  OrderSource,
  CreateOrderInput,
} from "@/types/shop/order";
import type { PaymentMethod } from "@/types/shop/payment";
import type { ProductChannel } from "@/types/shop/product";

export interface StockHoldItem {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface StockRequestItem {
  product_id: number;
  variant_id?: number | null;
  quantity?: number;
}

export type JobType = "expire" | "event_hook" | "calendar_sync" | "event_reminder";

export interface ExpireJob {
  type: "expire";
  order_number: string;
  attempt?: number;
}

export interface EventHookJob {
  type: "event_hook";
  order_number: string;
  event_id: string;
  user_istid: string;
  attempt?: number;
}

export interface CalendarSyncJob {
  type: "calendar_sync";
  source?: "notion_webhook" | "manual" | "website_mutation";
  attempt?: number;
}

export interface EventReminderJob {
  type: "event_reminder";
  event_id: string;
  attempt?: number;
}

export type JobPayload = ExpireJob | EventHookJob | CalendarSyncJob | EventReminderJob;

export const DELAYED_JOBS_KEY = "jobs:delayed";
export const STREAM_KEY = "jobs:stream";
export const STREAM_GROUP = "shop_workers";
export const DEAD_LETTER_KEY = "orders:hooks:dead_letter";
export const CALENDAR_SYNC_PENDING_KEY = "events:sync:pending";
export const CALENDAR_SYNC_LOCK_KEY = "events:sync:lock";
export const CHECKOUT_HOLD_TTL_SECONDS = 15 * 60;
export const CHECKOUT_SESSION_PREFIX = "checkout:session:";
export const CHECKOUT_CART_PREFIX = "checkout:cart:";
export const MBWAY_REQ_PREFIX = "mbway:req:";
export const SUMUP_BRIDGE_REDEEMED_PREFIX = "sumup:bridge:redeemed:";

export interface CheckoutSessionData extends Omit<
  CreateOrderInput,
  "items" | "payment" | "order_source"
> {
  order_number: string;
  order_source: OrderSource;
  total_amount: number;
  payment_method?: PaymentMethod | null;
  items: Array<CreateOrderItemInput | OrderItem>;
  reference?: string;
  shift_id?: string | null;
  attempt?: number;
  cart_id?: string;
  created_at: string;
  expires_at: string;
}

export interface BuildCheckoutSessionOptions {
  orderNumber: string;
  channel: ProductChannel;
  totalAmount: number;
  items: Array<StockRequestItem & { deliver_now?: boolean }>;
  paymentMethod?: PaymentMethod | null;
  userIstid?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNif?: string | null;
  campus?: string | null;
  notes?: string | null;
  discountCode?: string | null;
  shiftId?: string | null;
  cartId?: string | null;
  stockOverride?: boolean;
  createdBy?: string | null;
  ttlSeconds?: number;
  createdAt?: string;
  expiresAt?: string;
}

export interface MbWayCachedRequest {
  requestId: string;
  orderNumber?: string | null;
  orderNumbers?: string[];
  shiftId?: string | null;
  totalAmount?: number | string;
  phone?: string;
  status?: string;
  message?: string;
  createdAt?: number;
}
