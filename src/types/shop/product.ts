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

const OPTION_ORDER_PREFIX = "__ord";
const OPTION_ORDER_SEPARATOR = "__::";

type ParsedOptionEntry = {
  index: number;
  key: string;
  value: string;
  originalPosition: number;
};

function makeOrderedStorageKey(index: number, key: string): string {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const paddedIndex = String(safeIndex).padStart(4, "0");
  return `${OPTION_ORDER_PREFIX}${paddedIndex}${OPTION_ORDER_SEPARATOR}${key}`;
}

function parseOrderedStorageKey(rawKey: string): { index: number; key: string } {
  if (!rawKey.startsWith(OPTION_ORDER_PREFIX))
    return { index: Number.MAX_SAFE_INTEGER, key: rawKey };

  const separatorIndex = rawKey.indexOf(OPTION_ORDER_SEPARATOR);
  if (separatorIndex === -1) return { index: Number.MAX_SAFE_INTEGER, key: rawKey };

  const indexPart = rawKey.slice(OPTION_ORDER_PREFIX.length, separatorIndex);
  const parsedIndex = Number.parseInt(indexPart, 10);
  const key = rawKey.slice(separatorIndex + OPTION_ORDER_SEPARATOR.length);

  if (!Number.isFinite(parsedIndex) || !key) return { index: Number.MAX_SAFE_INTEGER, key: rawKey };

  return { index: parsedIndex, key };
}

export function encodeVariantOptionsForStorage(
  options: Record<string, string>
): Record<string, string> {
  const entries = Object.entries(options ?? {});
  const encoded: Record<string, string> = {};

  entries.forEach(([key, value], index) => {
    encoded[makeOrderedStorageKey(index, key)] = value;
  });

  return encoded;
}

export function decodeVariantOptionsFromStorage(
  options: Record<string, string> | null | undefined
): Record<string, string> {
  const rawEntries = Object.entries(options ?? {});
  if (!rawEntries.some(([key]) => key.startsWith(OPTION_ORDER_PREFIX)))
    return Object.fromEntries(rawEntries);

  const entries: ParsedOptionEntry[] = rawEntries.map(([rawKey, value], originalPosition) => ({
    ...parseOrderedStorageKey(rawKey),
    value,
    originalPosition,
  }));

  entries.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return a.originalPosition - b.originalPosition;
  });

  const decoded: Record<string, string> = {};
  for (const entry of entries) decoded[entry.key] = entry.value;

  return decoded;
}

export function restoreVariantOptionOrder(
  variants: ProductVariant[] | undefined
): ProductVariant[] {
  return (variants ?? []).map((variant) => ({
    ...variant,
    options: decodeVariantOptionsFromStorage(variant.options),
  }));
}

export function mapdbProductToProduct(row: dbProduct): Product {
  const mappedVariants = (row.variants ?? []).map(
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
  );

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
    variants: restoreVariantOptionOrder(mappedVariants),
  };
}
