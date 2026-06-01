"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FiImage } from "react-icons/fi";
import { Product } from "@/types/shop/product";
import styles from "@/styles/components/shop/ProductCard.module.css";

export default function ProductCard({ product, dict }: { product: Product; dict?: any }) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = [
    ...new Set([
      ...(product.images || []),
      ...(product.variants?.flatMap((v) => v.images || []) || []),
    ]),
  ];
  const currentImage = images[imageIndex];

  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>
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
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{dict?.products?.[product.name]?.title ?? product.name}</h3>
      </div>
      <div className={styles.price}>{product.price}€</div>
    </Link>
  );
}
