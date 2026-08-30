import ProductForm from "@/components/shop/ProductForm";
import { getAllCategories } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";

export default async function NewProductPage() {
  await requireRoles([UserRole._ADMIN]);
  const categories = await getAllCategories(true);

  return <ProductForm isEdit={false} backHref="/shop/manage" categories={categories} />;
}
