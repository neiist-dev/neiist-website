"use client";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/shop";
import styles from "@/styles/components/shop/ProductCard.module.css";

export default function ProductCard({ product }: { product: Product }) {
  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0], //Use first image as product icon
      quantity: 1,
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    //TODO: Add some message to the user
  };

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
      <button onClick={addToCart} className={styles.addBtn}>
        Adicionar ao Carrinho
      </button>
    </Link>
  );
}
