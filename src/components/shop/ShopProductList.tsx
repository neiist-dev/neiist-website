import Link from "next/link";
import { FiPackage } from "react-icons/fi";
import { EmptyState, Button } from "@neiist/ui";
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
  const hasProducts = products.length > 0;

  return (
    <div className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict.title} />
      <p className={styles.subTitle}>{dict.subtitle}</p>

      {hasProducts ? (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} dict={dict} basePath={basePath} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyContainer}>
          <EmptyState
            icon={<FiPackage />}
            title={dict.empty_title}
            description={dict.empty_subtitle}
            action={
              basePath ? (
                <Link href={basePath} style={{ textDecoration: "none" }}>
                  <Button variant="solid" color="primary">
                    {dict.empty_button}
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
