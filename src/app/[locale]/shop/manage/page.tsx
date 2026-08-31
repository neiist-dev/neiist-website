import { Suspense } from "react";
import ShopManagement from "@/components/shop/ShopManagement";
import { getAllProductsAdmin, getAllCategories } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

async function ShopManageContent({ params }: { params: LocaleParams }) {
  await requireRoles([UserRole._ADMIN]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);

  const [products, categories] = await Promise.all([getAllProductsAdmin(), getAllCategories(true)]);

  return (
    <ShopManagement
      products={products}
      categories={categories}
      dict={dict.shop_management}
      basePath={`/${locale}`}
    />
  );
}

export default function ShopManagePage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ShopManageContent params={params} />
    </Suspense>
  );
}
