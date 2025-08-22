import { Product, Order } from "@/types/shop";

//TODO: This should be done on sql function
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
