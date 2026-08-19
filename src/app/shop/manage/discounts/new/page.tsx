import DiscountCodeForm from "@/components/shop/DiscountCodeForm";
import { getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";

export default async function NewDiscountPage() {
  const [products, users] = await Promise.all([getAllProductsAdmin(), getAllUsers()]);

  return <DiscountCodeForm products={products} users={users} />;
}
