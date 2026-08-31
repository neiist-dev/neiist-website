import { Product, ProductVariant } from "@/types/shop/product";
import { Order, OrderItem } from "@/types/shop/order";
import { CampusScheduleInfo, DEFAULT_CAMPUS_SCHEDULES } from "@/types/shop/schedule";

const COLOR_KEYS = new Set(["cor", "color", "colour"]);
const SIZE_KEYS = new Set(["tamanho", "size"]);

const REGEX = {
  HEX: /#([0-9a-fA-F]{3,8})\b/,
  NAME_WITH_HEX: /^(.*?)\s*[-–—]?\s*#([0-9a-fA-F]{3,8})\b/,
  LABEL_DELIMITER: /\||,/,
};

const CAMPUS_LOCATIONS: Record<string, string> = {
  alameda: "Sala do NEIIST Alameda (Pavilhão de Informática I 3.03)",
  taguspark: "Sala do NEIIST Taguspark (1 - 4.14)",
};

export function getFeaturedAndTopProducts(
  products: Product[],
  orders: Order[]
): { featured?: Product; top: Product[] } {
  const salesCount = orders.reduce<Record<number, number>>((acc, order) => {
    order.items.forEach((item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const topProducts = [...products]
    .sort((a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0))
    .slice(0, 5);

  const featured =
    products.length > 0 ? products[Math.floor(Math.random() * products.length)] : undefined;

  return { featured, top: topProducts };
}

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

export function extractHex(val?: string): string | undefined {
  const match = val?.match(REGEX.HEX);
  return match ? `#${match[1]}` : undefined;
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

export function getCompactProductsSummary(items: OrderItem[]): string[] {
  return items.map((it) => {
    const { text: variantText } = formatVariantSimple(it.variant_options, it.variant_label);

    return variantText ? `${it.product_name} ${variantText}`.trim() : it.product_name;
  });
}

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

export function getCampusSchedule(campus?: string): CampusScheduleInfo | null {
  if (!campus) return null;
  const normalizedCampus = campus.trim().toLowerCase();
  return DEFAULT_CAMPUS_SCHEDULES[normalizedCampus] ?? null;
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

export function sanitizeOrder(order: Order): Order {
  return {
    ...order,
    customer_email: order.customer_email ? maskEmail(order.customer_email) : undefined,
    customer_phone: order.customer_phone ? maskPhone(order.customer_phone) : undefined,
    customer_nif: undefined,
    mbway_number: undefined,
    notes: undefined,
  };
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

export function isProductAvailable(
  product: Product,
  selectedVariant?: ProductVariant | null
): boolean {
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
  if (isProductDeadlinePassed(product)) {
    return dict.error_deadline;
  }

  return isProductAvailable(product, selectedVariant) ? null : dict.error_unavailable;
}
