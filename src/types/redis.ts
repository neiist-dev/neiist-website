import type {
  OrderItem,
  CreateOrderItemInput,
  OrderSource,
  CreateOrderInput,
} from "@/types/shop/order";

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

export interface CheckoutSessionData extends Omit<
  CreateOrderInput,
  "items" | "payment" | "order_source"
> {
  order_number: string;
  order_source: OrderSource;
  total_amount: number;
  payment_method: string;
  items: Array<CreateOrderItemInput | OrderItem>;
  reference?: string;
  shift_id?: string | null;
  attempt?: number;
  cart_id?: string;
  created_at: string;
  expires_at: string;
}
