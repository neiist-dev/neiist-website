"use client";

import { useEffect, useState } from "react";
import { useCartPopup } from "@/context/ShopContext";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { Squash } from "hamburger-react";
import { CartItem } from "@/types/shop";
import styles from "@/styles/components/shop/Cart.module.css";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";

export default function Cart() {
  const { isOpen, closeCart } = useCartPopup();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const load = () => setCartItems(JSON.parse(localStorage.getItem("cart") || "[]"));
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, [isOpen]);

  const handleRemove = (idx: number) => {
    setCartItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      localStorage.setItem("cart", JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
      return next;
    });
  };

  const handleQuantity = (idx: number, delta: number) => {
    setCartItems((prev) => {
      const next = prev.map((item, i) =>
        i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      );
      localStorage.setItem("cart", JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
      return next;
    });
  };

  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      (item.product.price +
        (item.variantId
          ? (item.product.variants.find((v) => v.id === item.variantId)?.price_modifier ?? 0)
          : 0)) *
        item.quantity,
    0
  );

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
            cartItems.map((item, idx) => {
              const variantObj = item.variantId
                ? item.product.variants.find((v) => v.id === item.variantId)
                : undefined;
              const price = item.product.price + (variantObj ? variantObj.price_modifier : 0);
              const imageSrc =
                variantObj && Array.isArray(variantObj.images) && variantObj.images.length > 0
                  ? variantObj.images[0]
                  : item.product.images[0];
              const colorInfo = getColorFromOptions(
                variantObj?.options ?? undefined,
                variantObj?.label ?? undefined
              );
              return (
                <div key={idx} className={styles.item}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={imageSrc}
                      alt={item.product.name}
                      fill
                      className={styles.productImage}
                    />
                  </div>
                  <div>
                    <h4>{item.product.name}</h4>
                    <div className={styles.color}>
                      <div className={styles.variantRow}>
                        {colorInfo.hex && (
                          <span
                            className={styles.colorDot}
                            style={{ backgroundColor: colorInfo.hex }}
                            title={colorInfo.name || colorInfo.hex}
                          />
                        )}
                        {variantObj &&
                          variantObj.options &&
                          (() => {
                            const entries = Object.entries(variantObj.options);
                            const nonColorEntries = entries.filter(([k]) => !isColorKey(k));
                            return nonColorEntries.length > 0
                              ? nonColorEntries.map(([k, v]) => (
                                  <span className={styles.sizeTag} key={k}>
                                    {`${k.trim()}: ${v}`}
                                  </span>
                                ))
                              : null;
                          })()}

                        <span className={styles.priceTag}>{price.toFixed(2)}€</span>

                        <button onClick={() => handleRemove(idx)} className={styles.trashBtn}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <div className={styles.quantityWrapper}>
                      <div className={styles.quantityBox}>
                        <button onClick={() => handleQuantity(idx, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleQuantity(idx, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <div>
            <span>Total: </span>
            <strong>{total.toFixed(2)}€</strong>
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
