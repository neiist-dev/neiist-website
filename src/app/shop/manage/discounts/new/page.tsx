import DiscountCodeForm from "@/components/shop/DiscountCodeForm";
import { getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";

export default async function NewDiscountPage() {
  await requireRoles([UserRole._ADMIN]);
  const [products, users] = await Promise.all([getAllProductsAdmin(), getAllUsers()]);

  return <DiscountCodeForm products={products} users={users} />;
}
