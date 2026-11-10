import type { Dictionary } from "@/i18n/dictionaries";
import type { CartItem, Product, ProductVariant } from "@/types/shop/product";

export function formatShiftOpenedAt(
  openedAt: string | Date,
  dict: Dictionary["pos"]["shift"]
): string {
  const date = new Date(openedAt);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return dict.opened_today.replace("{time}", timeStr);

  const dateStr = date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });
  return dict.opened_on.replace("{date}", dateStr).replace("{time}", timeStr);
}

export function formatPosTimestamp(
  dateStr: string | Date | null | undefined,
  todayLabel: string,
  locale: string = "pt"
): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const dateLocale = locale === "en" ? "en-GB" : "pt-PT";
  const timeStr = d.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return `${todayLabel}, ${timeStr}`;

  return `${d.toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}, ${timeStr}`;
}

export function getProductPosAvailability(product: Product, nowMs: number = Date.now()) {
  const isDeadlinePassed = Boolean(
    product.order_deadline && nowMs > new Date(product.order_deadline).getTime()
  );
  const isOutOfStock =
    product.stock_type === "limited" &&
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    product.stock_quantity <= 0;

  return { isDeadlinePassed, isOutOfStock };
}

export function upsertPosCartItem(
  prev: CartItem[],
  product: Product,
  variant: ProductVariant | null
): CartItem[] {
  const existingIdx = prev.findIndex(
    (item) => item.product.id === product.id && (item.variantId ?? null) === (variant?.id ?? null)
  );
  if (existingIdx >= 0) {
    const next = [...prev];
    next[existingIdx] = {
      ...next[existingIdx],
      quantity: next[existingIdx].quantity + 1,
    };
    return next;
  }
  return [...prev, { product, variantId: variant?.id, quantity: 1 }];
}

export function updatePosCartItemQuantity(
  prev: CartItem[],
  index: number,
  delta: number
): CartItem[] {
  const item = prev[index];
  if (!item) return prev;
  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    return prev.filter((_, i) => i !== index);
  }
  const next = [...prev];
  next[index] = { ...item, quantity: newQty };
  return next;
}
