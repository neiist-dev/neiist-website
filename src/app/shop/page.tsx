import { getAllProducts, getAllCategories } from "@/utils/dbUtils";
import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <div className={styles.content}>
      <ShopProductList products={products} categories={categories} />
    </div>
  );
}
