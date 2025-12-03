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
    <div className={styles.shopContainer}>
      <div className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>Shop</h1>
        <p className={styles.shopSubtitle}>Os produtos que representam o teu curso!</p>
      </div>

      <div className={styles.grid}>
        {randomProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
