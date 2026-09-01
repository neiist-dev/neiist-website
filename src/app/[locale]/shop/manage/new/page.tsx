import ProductForm from "@/components/shop/ProductForm";
import { getAllCategories } from "@/lib/db/repositories/shop.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function NewProductPage({ params }: { params: LocaleParams }) {
  await requireRoles([UserRole._ADMIN]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop.product_form;

  const categories = await getAllCategories(true);

  return (
    <ProductForm
      isEdit={false}
      backHref={`/${locale}/shop/manage`}
      categories={categories}
      dict={dict}
    />
  );
}
