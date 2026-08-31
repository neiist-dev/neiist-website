import { Suspense } from "react";
import DiscountCodeManagement from "@/components/shop/DiscountCodeManagement";
import { getAllDiscountCodes, getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { getDictionary } from "@/i18n/dictionaries";

async function DiscountCodesContent({ params }: { params: LocaleParams }) {
  await requireRoles([UserRole._ADMIN]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).discount_codes;

  const [products, discountCodes, users] = await Promise.all([
    getAllProductsAdmin(),
    getAllDiscountCodes(),
    getAllUsers(),
  ]);

  return (
    <DiscountCodeManagement
      products={products}
      discountCodes={discountCodes}
      users={users}
      basePath={`/${locale}`}
      dict={dict}
    />
  );
}

export default function DiscountCodesPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <DiscountCodesContent params={params} />
    </Suspense>
  );
}
