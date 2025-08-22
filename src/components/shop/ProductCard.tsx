"use client";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>
      <Image
        src={product.images[0]}
        alt={product.name}
        width={300}
        height={300}
        className={styles.image}
      />
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.description}>{product.description}</p>
      <div className={styles.price}>{product.price}€</div>
    </Link>
  );
}
