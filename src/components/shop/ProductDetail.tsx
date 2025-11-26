"use client";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductInfo from "@/components/shop/ProductInfo";
import ProductCard from "@/components/shop/ProductCard";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
}

export default function ProductDetail({ product, allProducts }: ProductDetailProps) {
  const related = allProducts.filter((p) => p.id !== product.id && p.category === product.category);

  return (
    <div style={{ padding: 16 }} className={styles.container}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <div>
          <ProductGallery images={product.images} />
        </div>
        <div>
          <ProductInfo product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ margin: "8px 0 16px" }}>Produtos Relacionados</h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
            {related.map((r) => (
              <div key={r.id} style={{ minWidth: 220 }}>
                <ProductCard product={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
