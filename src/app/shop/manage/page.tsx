import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProductsAdmin, getAllCategories } from "@/utils/dbUtils";

export default async function ShopManagePage() {
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getAllCategories(true)]);

  return <ShopManagement products={products} categories={categories} />;
}
