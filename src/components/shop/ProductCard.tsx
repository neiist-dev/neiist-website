"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FiImage } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import { getProductTimingBadge } from "@/utils/shop/shopUtils";
import styles from "@/styles/components/shop/ProductCard.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface ProductCardProps {
  product: Product;
  dict: Dictionary["shop"];
  basePath?: string;
}

export default function ProductCard({ product, dict, basePath }: ProductCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  const images = [
    ...new Set([
      ...(product.images || []),
      ...(product.variants?.flatMap((v) => v.images || []) || []),
    ]),
  ];

  const currentImage = images[imageIndex];
  const badge = getProductTimingBadge(product, {
    coming_soon: dict.buttons.coming_soon,
    unavailable: dict.buttons.unavailable,
  });

  return (
    <Link href={`${basePath || ""}/shop/${product.id}`} className={styles.card}>
      <div className={`${styles.imageWrapper} ${!currentImage ? styles.imageWrapperEmpty : ""}`}>
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            width={300}
            height={300}
            className={styles.image}
            onError={() => setImageIndex((i) => Math.min(i + 1, images.length - 1))}
          />
        ) : (
          <div className={styles.placeholder}>
            <FiImage size={40} />
            <span>{dict.no_image_label}</span>
          </div>
        )}
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
      </div>
      <div className={styles.price}>{product.price}€</div>
    </Link>
  );
}
