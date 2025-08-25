import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProducts, getAllCategories } from "@/utils/dbUtils";

export default async function ShopManagePage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return <ShopManagement products={products} categories={categories} />;
}
