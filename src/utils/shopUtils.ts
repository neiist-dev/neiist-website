import { Product, Order, OrderItem } from "@/types/shop";

export function getFeaturedAndTopProducts(products: Product[], orders: Order[]) {
  const salesCount: Record<number, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
    });
  });

  const topProducts = [...products]
    .sort((a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0))
    .slice(0, 5);

  const randomFeatured = products[Math.floor(Math.random() * products.length)];

  return {
    featured: randomFeatured,
    top: topProducts,
  };
}

export function splitNameHex(val?: string): { name: string; hex: string } {
  if (!val) return { name: "", hex: "" };
  const m = val.match(/^(.*?)\s*[-–—]?\s*#([0-9a-fA-F]{3,8})\b/);
  if (m) {
    return { name: m[1].trim(), hex: `#${m[2]}` };
  }
  const hexOnly = val.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hexOnly) return { name: val.replace(hexOnly[0], "").trim(), hex: hexOnly[0] };
  return { name: val.trim(), hex: "" };
}

export function joinNameHex(name: string, hex: string): string {
  name = (name || "").trim();
  hex = (hex || "").trim();
  if (!hex) return name;
  if (!name) return hex;
  return `${name} - ${hex}`;
}

export function extractHex(val?: string): string | undefined {
  if (!val) return undefined;
  const m = val.match(/#([0-9a-fA-F]{3,8})\b/);
  return m ? `#${m[1]}` : undefined;
}

export function isColorKey(key?: string) {
  if (!key) return false;
  const k = key.trim().toLowerCase();
  return ["cor", "color", "colour"].includes(k);
}

export function getColorFromOptions(
  options?: Record<string, string> | null,
  label?: string | null
): { name?: string; hex?: string } {
  if (options) {
    for (const rawKey of Object.keys(options)) {
      const key = rawKey.trim().toLowerCase();
      if (isColorKey(key)) {
        const value = options[rawKey] ?? "";
        const { name, hex } = splitNameHex(value);
        return { name: name || undefined, hex: hex || undefined };
      }
    }
  }

  if (label) {
    const parts = label.split(/\||,/).map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      if (!k) continue;
      const key = k.trim().toLowerCase();
      if (isColorKey(key)) {
        const value = rest.join(":").trim();
        const { name, hex } = splitNameHex(value);
        return { name: name || undefined, hex: hex || undefined };
      }
    }
  }
  return {};
}

export function getCompactProductsSummary(items: OrderItem[]): string[] {
  return items.map((it) => {
    const colorInfo = getColorFromOptions(
      it.variant_options ?? undefined,
      it.variant_label ?? undefined
    );
    const colorName = colorInfo.name ?? undefined;
    const size =
      it.variant_options?.Tamanho ||
      it.variant_options?.Size ||
      it.variant_label?.match(/XS|S|M|L|XL|XXL/)?.[0];

    return [`${it.quantity} - ${it.product_name}`, size ? size : "", colorName ? colorName : ""]
      .filter(Boolean)
      .join(" ");
  });
}
