import { Suspense } from "react";
import ShopProductList from "@/components/shop/catalog/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";
import { getAllProducts, getAllCategories } from "@/lib/db/repositories/shop.repository";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";

async function ShopContent({ params }: { params: LocaleParams }) {
  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).shop;

  const [products, categories] = await Promise.all([getAllProducts("web"), getAllCategories()]);

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

export default function ShopPage(props: { params: LocaleParams }) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ShopContent {...props} />
    </Suspense>
  );
}
