import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";
import { getAllProducts, getAllCategories } from "@/lib/db/repositories/shop.repository";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <div className={styles.content}>
      <ShopProductList products={products} categories={categories} />
    </div>
  );
}
