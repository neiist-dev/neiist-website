import { buildProductImageUrl, restoreVariantOptionOrder } from "@/utils/shop/shopUtils";
import { parseDbNumeric } from "@/utils/shop/moneyUtils";

export type ProductType = "merchandise" | "event_ticket" | "food_drink";
export type ProductChannel = "web" | "pos" | "fast-pos";
export type StockType = "limited" | "on_demand" | "untracked";

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  images: string[];
  category?: string | null;
  product_type: ProductType;
  channels: ProductChannel[];
  stock_type: StockType;
  stock_quantity?: number | null;
  event_id?: string | null;
  event_hook?: string | null;
  order_start?: string | null;
  order_deadline?: string | null;
  estimated_delivery?: string | null;
  size_guide?: string | null;
  active?: boolean;
  variants: ProductVariant[];
}

export interface dbProduct {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  images: string[] | null;
  category: string | null;
  product_type?: string | null;
  channels?: string[] | string | null;
  stock_type: string;
  stock_quantity: number | null;
  event_id?: string | null;
  event_hook?: string | null;
  order_start: string | null;
  order_deadline: string | null;
  estimated_delivery?: string | null;
  size_guide?: string | null;
  active: boolean | null;
  variants: dbProductVariant[] | null;
}

export interface ProductVariant {
  id: number;
  sku?: string | null;
  images?: string[];
  price_modifier: number;
  stock_quantity?: number | null;
  active: boolean;
  options: Record<string, string>;
  label?: string | null;
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

export interface ProductVariantInput {
  id?: number;
  sku?: string | null;
  images?: string[];
  options?: Record<string, string>;
  price_modifier?: number;
  stock_quantity?: number | null;
  active?: boolean;
}

export type CreateProductInput = Partial<Product> & {
  name: string;
  price: number;
  stock_type: Product["stock_type"];
  active?: boolean;
};

export type ProductInventoryStatus =
  "sales_disabled" | "scheduled" | "closed" | "sold_out" | "on_sale";

export interface StockChangeInput {
  variantId?: number | null;
  delta?: number;
  set?: number;
}

export interface CartItem {
  product: Product;
  variantId?: number;
  quantity: number;
}

function parseProductChannels(raw: string[] | string | null | undefined): ProductChannel[] {
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw
          .replace(/^\{|\}$/g, "")
          .split(",")
          .map((s) => s.replace(/^"+|"+$/g, "").trim())
      : [];
  const channels = items.filter((c): c is ProductChannel => Boolean(c));
  return channels.length > 0 ? channels : ["web", "pos"];
}

export function mapdbProductToProduct(row: dbProduct): Product {
  const mappedVariants = (row.variants ?? []).map((variant): ProductVariant => ({
    id: variant.id,
    sku: variant.sku ?? undefined,
    images: variant.images ? variant.images.map(buildProductImageUrl) : undefined,
    price_modifier: parseDbNumeric(variant.price_modifier ?? 0),
    stock_quantity: variant.stock_quantity ?? undefined,
    active: Boolean(variant.active),
    options: variant.options ?? {},
    label: variant.label ?? undefined,
  }));

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price: parseDbNumeric(row.price),
    images: (row.images ?? []).map(buildProductImageUrl),
    category: row.category ?? undefined,
    product_type: (row.product_type as ProductType) || "merchandise",
    channels: parseProductChannels(row.channels),
    stock_type: (row.stock_type as Product["stock_type"]) || "limited",
    stock_quantity: row.stock_quantity ?? undefined,
    event_id: row.event_id ?? undefined,
    event_hook: row.event_hook ?? undefined,
    order_start: row.order_start ?? undefined,
    order_deadline: row.order_deadline ?? undefined,
    estimated_delivery: row.estimated_delivery ?? undefined,
    size_guide: row.size_guide ?? undefined,
    active: row.active ?? true,
    variants: restoreVariantOptionOrder(mappedVariants),
  };
}
