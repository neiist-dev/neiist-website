"use client";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product } from "@/types/shop/product";
import { Category } from "@/types/shop/category";
import ProductCard from "@/components/shop/ProductCard";
import { ShopDict } from "@/types/i18n";
import ColorfulText from "../ColorfulText";

export default function ShopProductList({
  products,
  categories,
  dict,
}: {
  products: Product[];
  categories: Category[];
  dict?: ShopDict;
}) {
  return (
    <div className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict?.title ?? ""} />
      <p className={styles.subTitle}>{dict?.subtitle}</p>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} dict={dict} />
        ))}
      </div>
    </div>
  );
}
