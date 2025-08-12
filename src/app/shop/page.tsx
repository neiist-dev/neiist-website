//import { getShopProducts } from "@/utils/dbUtils";
import { getTempProducts } from "@/types/shop";
import ShopProductList from "@/components/shop/ShopProductList";
import styles from "@/styles/pages/Shop.module.css";

export default async function ShopPage() {
  const products = getTempProducts();
  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Loja NEIIST</h1>
      <ShopProductList products={products} />
    </div>
  );
}
