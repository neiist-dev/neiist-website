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
  stock_type: string;
  stock_quantity: number | null;
  order_deadline: string | null;
  active: boolean | null;
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

export interface CartItem {
  product: Product;
  variantId?: number;
  quantity: number;
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
    active: row.active ?? true,
    variants: (row.variants ?? []).map(
      (variant): ProductVariant => ({
        id: variant.id,
        sku: variant.sku ?? undefined,
        images: variant.images ?? undefined,
        price_modifier: Number(variant.price_modifier ?? 0),
        stock_quantity: variant.stock_quantity ?? undefined,
        active: Boolean(variant.active),
        options: variant.options ?? {},
        label: variant.label ?? undefined,
      })
    ),
  };
}
