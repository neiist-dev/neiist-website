"use client";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product, Category } from "@/types/shop";
import ProductCard from "@/components/shop/ProductCard";
import Fuse from "fuse.js";

export default function ShopProductList({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [randomProducts, setRandomProducts] = useState<Product[]>([]);

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ["name", "category", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [products]
  );

  useEffect(() => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setRandomProducts(shuffled.slice(0, 6));
  }, [products]);

  const filtered = useMemo(() => {
    let filteredProducts = products;
    if (category !== "all") {
      const selectedCategory = categories.find((c) => c.id.toString() === category);
      const selectedName = selectedCategory?.name.trim().toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) => product.category && product.category.trim().toLowerCase() === selectedName
      );
    }
    if (search.trim()) {
      return fuse
        .search(search.trim())
        .map((r) => r.item)
        .filter(
          (product) =>
            category === "all" ||
            (product.category &&
              product.category.trim().toLowerCase() ===
                categories
                  .find((c) => c.id.toString() === category)
                  ?.name.trim()
                  .toLowerCase())
        );
    }
    return filteredProducts;
  }, [products, search, category, categories, fuse]);

  const showFiltered = category !== "all" || search.trim() !== "";

  return (
    <>
      <div className={styles.shopBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerText}>
            <h1 className={styles.bannerTitle}>NEIIST Store</h1>
            <p className={styles.bannerSubtitle}>
              Produtos oficiais do Núcleo de Estudantes de Informática do IST
            </p>
          </div>
          <div className={styles.bannerImages}>
            {randomProducts.slice(0, 3).map((product) => (
              <div key={product.id} className={styles.bannerImageWrapper}>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={120}
                  height={120}
                  className={styles.bannerImage}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.filtersSection}>
        <div className={styles.topRow}>
          <div className={styles.searchContainer}>
            <input
              className={styles.search}
              type="text"
              placeholder="Pesquisar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.categoryTabsHeader}>
            <button
              onClick={() => setCategory("all")}
              className={`${styles.tabButton} ${category === "all" ? styles.activeTab : ""}`}>
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id.toString())}
                className={`${styles.tabButton} ${category === cat.id.toString() ? styles.activeTab : ""}`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {showFiltered && (
          <div className={styles.resultsRow}>
            <div className={styles.resultsInfo}>
              {filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado
              {filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      <div className={styles.gridContainer}>
        <div className={styles.grid}>
          {showFiltered ? (
            filtered.length > 0 ? (
              filtered.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className={styles.noResults}>
                Nenhum produto encontrado com os critérios selecionados.
              </div>
            )
          ) : (
            randomProducts.map((product) => <ProductCard key={product.id} product={product} />)
          )}
        </div>
      </div>
    </>
  );
}
