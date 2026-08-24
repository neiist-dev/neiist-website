import { Suspense } from "react";
import DiscountCodeManagement from "@/components/shop/DiscountCodeManagement";
import { getAllDiscountCodes, getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";

async function DiscountCodesContent() {
  await requireRoles([UserRole._ADMIN]);
  const [products, discountCodes, users] = await Promise.all([
    getAllProductsAdmin(),
    getAllDiscountCodes(),
    getAllUsers(),
  ]);

  return <DiscountCodeManagement products={products} discountCodes={discountCodes} users={users} />;
}

export default function DiscountCodesPage() {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <DiscountCodesContent />
    </Suspense>
  );
}
