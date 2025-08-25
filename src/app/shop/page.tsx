import { getAllProducts, getAllOrders, getAllCategories } from "@/utils/dbUtils";
import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";

export default async function ShopPage() {
  const [products, orders, categories] = await Promise.all([
    getAllProducts(),
    getAllOrders(),
    getAllCategories(),
  ]);

  return (
    <div className={styles.content}>
      <ShopProductList products={products} orders={orders} categories={categories} />
    </div>
  );
}
