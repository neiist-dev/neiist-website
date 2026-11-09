import { Product, ProductVariant } from "@/types/shop/product";
import { Order, OrderItem } from "@/types/shop/order";
import { PaymentMethod } from "@/types/shop/payment";

/**
 * Converts stored image id or full URL to canonical /api/shop/photo/[id] URL.
 * TODO: on the db only stores an ID/UUID -> always goes thrue a mapper or directly to an api
 */
export function buildProductImageUrl(img: string): string {
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  const id = img.replace(/^\/?(api\/shop\/photo\/)?/, "");
  return `/api/shop/photo/${id}`;
}

/**
 * Product image list format (product images first, then variant images)
 */
export function getProductImages(product: Product): string[] {
  return [
    ...new Set(
      [
        ...(product.images || []),
        ...(product.variants || []).flatMap((v) => v.images || []),
      ].filter(Boolean)
    ),
  ];
}

/**
 * Item variant image[0] if not available uses main product image[0]
 */
export function getItemImage(product: Product, variant?: ProductVariant | null): string | null {
  return variant?.images?.[0] ?? product.images?.[0] ?? null;
}

const normalizeOptionValue = (value?: string) => value?.replace(/["'\\]/g, "").trim() ?? "";

/**
 * True when every selected key/value matches the variant's options.
 */
export const matchesSelections = (
  variantOptions: Record<string, string> = {},
  selections: Record<string, string>
): boolean =>
  Object.entries(selections).every(
    ([key, value]) => normalizeOptionValue(variantOptions[key]) === normalizeOptionValue(value)
  );

/**
 * Find variant by id or matching options
 */
export function findItemVariant(
  product: Product,
  selection: {
    variant_id?: number | null;
    variant_options?: Record<string, string> | null;
  }
): ProductVariant | undefined {
  const variants = product.variants || [];
  if (!variants.length) return undefined;

  if (selection.variant_id != null) {
    const byId = variants.find(
      (v) => v.id === selection.variant_id || String(v.id) === String(selection.variant_id)
    );
    if (byId) return byId;
  }

  if (selection.variant_options)
    return variants.find((v) => matchesSelections(v.options, selection.variant_options!));

  return undefined;
}

const COLOR_KEYS = new Set(["cor", "color", "colour"]);
const SIZE_KEYS = new Set(["tamanho", "size"]);

const REGEX = {
  HEX: /#([0-9a-fA-F]{3,8})\b/,
  NAME_WITH_HEX: /^(.*?)\s*[-–—]?\s*#([0-9a-fA-F]{3,8})\b/,
  LABEL_DELIMITER: /[|,]/,
};

export function splitNameHex(val?: string): { name: string; hex: string } {
  if (!val) return { name: "", hex: "" };

  const fullMatch = val.match(REGEX.NAME_WITH_HEX);
  if (fullMatch) return { name: fullMatch[1].trim(), hex: `#${fullMatch[2]}` };

  const hexMatch = val.match(REGEX.HEX);
  if (hexMatch) return { name: val.replace(hexMatch[0], "").trim(), hex: hexMatch[0] };

  return { name: val.trim(), hex: "" };
}

export function joinNameHex(name?: string, hex?: string): string {
  const cleanName = (name || "").trim();
  const cleanHex = (hex || "").trim();

  if (!cleanHex) return cleanName;
  if (!cleanName) return cleanHex;

  return `${cleanName} - ${cleanHex}`;
}

export function isColorKey(key?: string): boolean {
  return !!key && COLOR_KEYS.has(key.trim().toLowerCase());
}

export function getColorFromOptions(
  options?: Record<string, string> | null,
  label?: string | null
): { name?: string; hex?: string } {
  if (options) {
    const colorKey = Object.keys(options).find(isColorKey);
    if (colorKey) {
      const { name, hex } = splitNameHex(options[colorKey] ?? "");
      return { name: name || undefined, hex: hex || undefined };
    }
  }

  if (label) {
    const parts = label.split(REGEX.LABEL_DELIMITER).map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      if (isColorKey(k)) {
        const { name, hex } = splitNameHex(rest.join(":"));
        return { name: name || undefined, hex: hex || undefined };
      }
    }
  }
  return {};
}

export function formatVariantSimple(
  options?: Record<string, string> | null,
  label?: string | null
): { text: string; colorInfo: { name?: string; hex?: string } } {
  const colorInfo = getColorFromOptions(options, label);

  if (!options || Object.keys(options).length === 0) return { text: label || "", colorInfo };

  const parts: string[] = [];

  if (colorInfo.name) parts.push(colorInfo.name);

  const sizeEntry = Object.entries(options).find(([k]) => SIZE_KEYS.has(k.toLowerCase()));
  if (sizeEntry) parts.push(sizeEntry[1]);

  for (const [key, value] of Object.entries(options)) {
    const normalizedKey = key.toLowerCase();
    if (!isColorKey(normalizedKey) && !SIZE_KEYS.has(normalizedKey)) parts.push(value);
  }

  return {
    text: parts.filter(Boolean).join(" - "),
    colorInfo,
  };
}

export const OPTION_ORDER_PREFIX = "__ord";
export const OPTION_ORDER_SEPARATOR = "__::";

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

export function isProductUpcoming(product?: { order_start?: string | null } | null): boolean {
  if (!product?.order_start) return false;
  return new Date(product.order_start).getTime() > Date.now();
}

export function isProductDeadlinePassed(
  product?: { stock_type?: string; order_deadline?: string | null } | null
): boolean {
  if (!product?.order_deadline || product.stock_type !== "on_demand") return false;
  return new Date(product.order_deadline).getTime() < Date.now();
}

export interface ProductTimingBadgeDict {
  coming_soon: string;
  unavailable: string;
}

export function getProductTimingBadge(
  product:
    | {
        stock_type?: string;
        order_start?: string | null;
        order_deadline?: string | null;
      }
    | null
    | undefined,
  dict: ProductTimingBadgeDict
): string | null {
  if (isProductUpcoming(product)) return dict.coming_soon;
  if (isProductDeadlinePassed(product)) return dict.unavailable;
  return null;
}

export interface ProductUnavailableDict {
  error_upcoming: string;
  error_deadline: string;
  error_unavailable: string;
}

function isProductAvailable(product: Product, selectedVariant?: ProductVariant | null): boolean {
  if (isProductUpcoming(product) || isProductDeadlinePassed(product)) {
    return false;
  }
  return product.variants.length === 0
    ? product.stock_type !== "limited" || (product.stock_quantity ?? 0) > 0
    : !!selectedVariant &&
        selectedVariant.active &&
        (product.stock_type !== "limited" || (selectedVariant.stock_quantity ?? 0) > 0);
}

export function getProductUnavailableReason(
  product: Product,
  selectedVariant: ProductVariant | null | undefined,
  dict: ProductUnavailableDict
): string | null {
  if (isProductUpcoming(product)) {
    const date = new Date(product.order_start!).toLocaleDateString();
    return dict.error_upcoming.replace("{date}", date);
  }
  if (isProductDeadlinePassed(product)) return dict.error_deadline;

  return isProductAvailable(product, selectedVariant) ? null : dict.error_unavailable;
}

export function getCompactProductsSummary(items: OrderItem[]): string[] {
  return items.map((it) => {
    const { text: variantText } = formatVariantSimple(it.variant_options, it.variant_label);
    return variantText ? `${it.product_name} ${variantText}`.trim() : it.product_name;
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length <= 2 ? "***" : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}

export function sanitizeOrder(order: Order): Order {
  return {
    ...order,
    customer_email: order.customer_email ? maskEmail(order.customer_email) : undefined,
    customer_phone: order.customer_phone ? maskPhone(order.customer_phone) : undefined,
    customer_nif: undefined,
    notes: undefined,
  };
}

const CAMPUS_LOCATIONS: Record<string, string> = {
  alameda: "Sala do NEIIST Alameda (Pavilhão de Informática I 3.03)",
  taguspark: "Sala do NEIIST Taguspark (1 - 4.14)",
};

export function formatCampus(campus?: string): string {
  if (!campus) return "";
  return campus
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

export function getCampusLocation(campus?: string): string {
  if (!campus) return "uma banca NEIIST";
  const normalizedCampus = campus.trim().toLowerCase();
  return CAMPUS_LOCATIONS[normalizedCampus] || `banca NEIIST em ${formatCampus(campus)}`;
}

export function getPaymentLabel(
  method: PaymentMethod,
  dict: Record<PaymentMethod, string>
): string {
  return dict[method];
}

export function getLocalizedPaymentMethods(
  methods: ReadonlyArray<PaymentMethod>,
  dict: Record<PaymentMethod, string>
): Array<{ id: PaymentMethod; label: string }> {
  return methods.map((method) => ({
    id: method,
    label: getPaymentLabel(method, dict),
  }));
}
