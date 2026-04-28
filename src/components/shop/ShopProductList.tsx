"use client";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product, Category } from "@/types/shop";
import ProductCard from "@/components/shop/ProductCard";

export default function ShopProductList({
  products,
  categories,
  dict,
}: {
  products: Product[];
  categories: Category[];
  dict?: any;
}) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.primary}>{dict?.title_letters?.[0]}</span>
        <span className={styles.secondary}>{dict?.title_letters?.[1]}</span>
        <span className={styles.tertiary}>{dict?.title_letters?.[2]}</span>
        <span className={styles.quaternary}>{dict?.title_letters?.[3]}</span>
      </h1>
      <p className={styles.subTitle}>{dict?.subtitle}</p>

      <div className={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} dict={dict} />
        ))}
      </div>
    </div>
  );
}
