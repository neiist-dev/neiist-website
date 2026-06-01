import DiscountCodeForm from "@/components/shop/DiscountCodeForm";
import { getAllProductsAdmin, getAllUsers } from "@/utils/dbUtils";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  const [products, users] = await Promise.all([getAllProductsAdmin(), getAllUsers()]);

  return <DiscountCodeForm products={products} users={users} />;
}
