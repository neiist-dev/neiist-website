"use client";
import { useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product } from "@/types/shop";

export default function ShopProductList({ products }: { products: Product[] }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((cat): cat is string => typeof cat === "string"))
  );

  const filtered = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className={styles.filters}>
        <input
          className={styles.search}
          type="text"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setCategory("all")}
          className={category === "all" ? styles.active : ""}>
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={category === cat ? styles.active : ""}>
            {cat}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
