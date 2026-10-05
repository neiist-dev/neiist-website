import { Suspense } from "react";
import DiscountCodeForm from "@/components/shop/DiscountCodeForm";
import { getAllProductsAdmin } from "@/lib/db/repositories/shop.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { requirePermission } from "@/lib/auth";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { getDictionary } from "@/i18n/dictionaries";
import GlobalLoading from "@/app/loading";

async function NewDiscountContent({ params }: { params: LocaleParams }) {
  await requirePermission("shop:write");
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).discount_codes.form;

  const [products, users] = await Promise.all([getAllProductsAdmin(), getAllUsers()]);

  return (
    <DiscountCodeForm
      products={products}
      users={users}
      backHref={`/${locale}/shop/manage/discounts`}
      dict={dict}
    />
  );
}

export default function NewDiscountPage({ params }: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <NewDiscountContent params={params} />
    </Suspense>
  );
}
