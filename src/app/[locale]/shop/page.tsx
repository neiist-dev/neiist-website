import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";
import { getAllProducts, getAllCategories } from "@/lib/db/repositories/shop.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

export default async function ShopPage({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop;

  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <div className={styles.content}>
      <ShopProductList
        products={products}
        categories={categories}
        dict={dict}
        basePath={`/${locale}`}
      />
    </div>
  );
}
