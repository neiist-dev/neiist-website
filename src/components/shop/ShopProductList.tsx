import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import ProductCard from "@/components/shop/ProductCard";
import ColorfulText from "@/components/ColorfulText";
import type { Dictionary } from "@/i18n/dictionaries";

interface ShopProductListProps {
  products: Product[];
  categories: Category[];
  dict: Dictionary["shop"];
  basePath?: string;
}

export default function ShopProductList({ products, dict, basePath }: ShopProductListProps) {
  return (
    <div className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict.title} />
      <p className={styles.subTitle}>{dict.subtitle}</p>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} dict={dict} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
