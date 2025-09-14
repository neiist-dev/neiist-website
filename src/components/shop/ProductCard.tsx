"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (!product.images || product.images.length < 2) return;
    const interval = setInterval(() => {
      setImageIndex((i) => (i + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product.images]);

  const handleThumbClick = (idx: number) => {
    setTimeout(() => {
      setImageIndex(idx);
    });
  };

  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.images[imageIndex]}
          alt={product.name}
          width={300}
          height={300}
          className={styles.image}
        />
      </div>
      {product.images.length > 1 && (
        <div className={styles.thumbnails}>
          {product.images.map((img, idx) => (
            <button
              key={img + idx}
              className={`${styles.thumbBtn} ${idx === imageIndex ? styles.activeThumb : ""}`}
              onClick={(e) => {
                e.preventDefault();
                handleThumbClick(idx);
              }}
              tabIndex={-1}
              aria-label={`Ver imagem ${idx + 1}`}
              type="button">
              <Image
                src={img}
                alt=""
                width={36}
                height={36}
                className={styles.thumbImg}
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
      </div>
      <div className={styles.price}>{product.price}€</div>
    </Link>
  );
}
