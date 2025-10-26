import { Product, Order } from "@/types/shop";

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

export function getCompactProductsSummary(order: Order) {
  const sizeSet = new Set(["XS", "S", "M", "L", "XL"]);
  return order.items
    .map((item) => {
      const qty = item.quantity;
      const name = item.product_name || String(item.product_id);
      let color = "";
      let size = "";
      let other = "";
      if (item.variant_label) {
        const colorMatch = item.variant_label.match(/Cor: ([^|]+)/);
        if (colorMatch) color = colorMatch[1].replace(/"/g, "").trim();
        const sizeMatch = item.variant_label.match(/Tamanho: ([^|]+)/);
        if (sizeMatch) size = sizeMatch[1].replace(/"/g, "").trim();
      }
      if ((!color || !size) && item.variant_options) {
        if (!color && item.variant_options.Cor) color = item.variant_options.Cor.replace(/"/g, "");
        if (!size && item.variant_options.Tamanho)
          size = item.variant_options.Tamanho.replace(/"/g, "");
      }
      if (!color && !size && item.variant_label) {
        other = item.variant_label.replace(/"/g, "").trim();
      }
      if (!color && !size && other) {
        const sizeOnlyMatch = other.match(/^Tamanho: "?([A-Z]{1,3})"?$/i);
        if (sizeOnlyMatch && sizeSet.has(sizeOnlyMatch[1])) {
          size = sizeOnlyMatch[1];
          other = "";
        }
      }
      let variantStr = "";
      if (color && size) {
        variantStr = `${color} (${size})`;
      } else if (color) {
        variantStr = color;
      } else if (size) {
        variantStr = sizeSet.has(size) ? `(${size})` : `(Tamanho: ${size})`;
      } else if (other) {
        variantStr = `(${other})`;
      }
      return `${qty} - ${name}${variantStr ? " " + variantStr : ""}`;
    })
    .join("\n");
}
