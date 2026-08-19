import DiscountCodeManagement from "@/components/shop/DiscountCodeManagement";
import { getAllDiscountCodes, getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";

export default async function DiscountCodesPage() {
  const [products, discountCodes, users] = await Promise.all([
    getAllProductsAdmin(),
    getAllDiscountCodes(),
    getAllUsers(),
  ]);

  return <DiscountCodeManagement products={products} discountCodes={discountCodes} users={users} />;
}
