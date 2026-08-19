import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProductsAdmin, getAllCategories } from "@/lib/db/repositories/shop.repository";

export default async function ShopManagePage() {
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getAllCategories(true)]);

  return <ShopManagement products={products} categories={categories} />;
}
