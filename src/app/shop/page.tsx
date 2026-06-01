import { getAllProducts, getAllCategories } from "@/utils/dbUtils";
import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function ShopPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <div className={styles.content}>
      <ShopProductList products={products} categories={categories} dict={dict.shop} />
    </div>
  );
}
