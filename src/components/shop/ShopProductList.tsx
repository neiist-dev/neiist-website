"use client";
import { useState, useEffect } from "react";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product, Category } from "@/types/shop";
import ProductCard from "@/components/shop/ProductCard";

export default function ShopProductList({
  products,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);

  useEffect(() => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setRandomProducts(shuffled.slice(0, 6));
  }, [products]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.primary}>L</span>
        <span className={styles.secondary}>o</span>
        <span className={styles.tertiary}>j</span>
        <span className={styles.quaternary}>a</span>
      </h1>
      <p className={styles.subTitle}>Os produtos que representam o teu curso!</p>

      <div className={styles.grid}>
        {randomProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
