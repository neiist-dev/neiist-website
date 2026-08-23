import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProductsAdmin, getAllCategories } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";

export default async function ShopManagePage() {
  await requireRoles([UserRole._ADMIN]);
  const [products, categories] = await Promise.all([getAllProductsAdmin(), getAllCategories(true)]);

  return <ShopManagement products={products} categories={categories} />;
}
