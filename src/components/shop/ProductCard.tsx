"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FiImage } from "react-icons/fi";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  const [imageIndex] = useState(0);

  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>
      <div
        className={`${styles.imageWrapper} ${!product.images?.length ? styles.imageWrapperEmpty : ""}`}>
        {product.images?.length > 0 ? (
          <Image
            src={product.images[imageIndex]}
            alt={product.name}
            width={300}
            height={300}
            className={styles.image}
          />
        ) : (
          <div className={styles.noImage}>
            <FiImage size={40} />
            <span>Sem Imagem</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
      </div>
      <div className={styles.price}>{product.price}€</div>
    </Link>
  );
}
