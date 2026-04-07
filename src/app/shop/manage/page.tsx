import { Suspense } from "react";
import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProductsAdmin, getAllCategories } from "@/utils/dbUtils";

export default async function ShopManagePage() {
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getAllCategories()]);

  return (
    <Suspense>
      <ShopManagement products={products} categories={categories} />
    </Suspense>
  );
}
