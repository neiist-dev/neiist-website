import { Suspense } from "react";
import ProductForm from "@/components/shop/ProductForm";
import { redirect } from "next/navigation";
import { getAllCategories, getProduct } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";
import { defaultLocale, isValidLocale } from "@/i18n/i18n-config";

import { getDictionary } from "@/i18n/dictionaries";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function EditProductContent({ params }: PageProps) {
  await requireRoles([UserRole._ADMIN]);
  const { locale: rawLocale, id } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop.product_form;

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) redirect(`/${locale}/shop/manage`);

  const [product, categories] = await Promise.all([getProduct(productId), getAllCategories(true)]);

  if (!product) redirect(`/${locale}/shop/manage`);

  return (
    <ProductForm
      product={product}
      isEdit={true}
      backHref={`/${locale}/shop/manage`}
      categories={categories}
      dict={dict}
    />
  );
}

export default function EditProductPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <EditProductContent {...props} />
    </Suspense>
  );
}
