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

export function getCompactProductsSummary(items: OrderItem[]): string[] {
  return items.map((it) => {
    const color = it.variant_options?.Cor || it.variant_options?.Color;
    const size =
      it.variant_options?.Tamanho ||
      it.variant_options?.Size ||
      it.variant_label?.match(/XS|S|M|L|XL|XXL/)?.[0];

    return [`${it.quantity} - ${it.product_name}`, size ? size : "", color ? color : ""]
      .filter(Boolean)
      .join(" ");
  });
}
