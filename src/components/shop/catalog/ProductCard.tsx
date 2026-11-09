"use client";

import Link from "next/link";
import { Product } from "@/types/shop/product";
import { getProductTimingBadge } from "@/utils/shop/shopUtils";
import ProductImage from "@/components/shop/catalog/ProductImage";
import { formatMoney } from "@/utils/shop/moneyUtils";
import styles from "@/styles/components/shop/catalog/ProductCard.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface ProductCardProps {
  product: Product;
  dict: Dictionary["shop"];
  basePath?: string;
}

export default function ProductCard({ product, dict, basePath }: ProductCardProps) {
  const badge = getProductTimingBadge(product, {
    coming_soon: dict.buttons.coming_soon,
    unavailable: dict.buttons.unavailable,
  });

  return (
    <Link href={`${basePath || ""}/shop/${product.id}`} className={styles.card}>
      <ProductImage
        product={product}
        alt={product.name}
        wrapperClassName={styles.imageWrapper}
        wrapperEmptyClassName={styles.imageWrapperEmpty}
        imageClassName={styles.image}
        placeholderClassName={styles.placeholder}
        placeholderLabel={dict.no_image_label}>
        {badge && <span className={styles.badge}>{badge}</span>}
      </ProductImage>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
      </div>
      <div className={styles.price}>{formatMoney(product.price)}</div>
    </Link>
  );
}
