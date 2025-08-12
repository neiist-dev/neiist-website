"use client";

import { useEffect, useState } from "react";
import { useCartPopup } from "@/context/ShopContext";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { Squash } from "hamburger-react";
import styles from "@/styles/components/shop/Cart.module.css";

type CartItem = {
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
};

export default function Cart() {
  const { isOpen, closeCart, refreshCart } = useCartPopup();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const items = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(items);
    }
    const handler = () => {
      const items = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(items);
    };
    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, [isOpen]);

  const handleRemove = (idx: number) => {
    const newCart = cartItems.filter((_, i) => i !== idx);
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
    refreshCart();
  };

  const handleQuantity = (idx: number, delta: number) => {
    const newCart = cartItems.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
    refreshCart();
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeCart}>
      <div className={styles.cart} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={closeCart}>
          <Squash toggled={true} size={24} />
        </button>

        <h2>Carrinho</h2>

        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <p className={styles.empty}>O teu carrinho está vazio.</p>
          ) : (
            cartItems.map((item, idx) => (
              <div key={idx} className={styles.item}>
                <Image src={item.image} alt={item.name} width={48} height={48} />
                <div>
                  <h4>{item.name}</h4>
                  {item.variant && <p>{item.variant}</p>}
                  <strong>{item.price}€</strong>
                  <div className={styles.quantity}>
                    <button onClick={() => handleQuantity(idx, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantity(idx, 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => handleRemove(idx)}>
                  <FiTrash2 />
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div>
            <span>Total: </span>
            <strong>{total}€</strong>
          </div>
          <button
            disabled={cartItems.length === 0}
            onClick={() => {
              closeCart();
              window.location.href = "/shop/checkout";
            }}>
            Continuar Para Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
