import DiscountCodeForm from "@/components/shop/DiscountCodeForm";
import { getAllProductsAdmin } from "@/utils/dbUtils";
import { getAllUsers } from "@/utils/db/userQueries";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  const [products, users] = await Promise.all([getAllProductsAdmin(), getAllUsers()]);

  return <DiscountCodeForm products={products} users={users} />;
}
