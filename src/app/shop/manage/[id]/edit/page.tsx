import ProductForm from "@/components/shop/ProductForm";
import { redirect } from "next/navigation";
import { getAllCategories, getProduct } from "@/utils/dbUtils";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    redirect("/shop/manage");
  }

  const [product, categories] = await Promise.all([getProduct(productId), getAllCategories()]);

  if (!product) {
    redirect("/shop/manage");
  }

  return (
    <ProductForm product={product} isEdit={true} backHref="/shop/manage" categories={categories} />
  );
}
