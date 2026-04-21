import ProductForm from "@/components/shop/ProductForm";
import { getAllCategories } from "@/utils/dbUtils";

export default async function NewProductPage() {
  const categories = await getAllCategories(true);

  return <ProductForm isEdit={false} backHref="/shop/manage" categories={categories} />;
}
