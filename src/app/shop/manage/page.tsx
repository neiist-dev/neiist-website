import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProducts } from "@/utils/dbUtils";

export default async function ShopManagePage() {
  const products = await getAllProducts();

  return <ShopManagement products={products} />;
}
