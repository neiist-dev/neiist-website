import { Suspense } from "react";
import ProductForm from "@/components/shop/ProductForm";
import { redirect } from "next/navigation";
import { getAllCategories, getProduct } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditProductContent({ params }: PageProps) {
  await requireRoles([UserRole._ADMIN]);
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) redirect("/shop/manage");

  const [product, categories] = await Promise.all([getProduct(productId), getAllCategories(true)]);

  if (!product) redirect("/shop/manage");

  return (
    <ProductForm product={product} isEdit={true} backHref="/shop/manage" categories={categories} />
  );
}

export default function EditProductPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <EditProductContent {...props} />
    </Suspense>
  );
}
