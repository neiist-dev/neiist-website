import { getAllProducts, getAllOrders } from "@/utils/dbUtils";
import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";

export default async function ShopPage() {
  const [products, orders] = await Promise.all([getAllProducts(), getAllOrders()]);

  return (
    <div className={styles.content}>
      <ShopProductList products={products} orders={orders} />
    </div>
  );
}
