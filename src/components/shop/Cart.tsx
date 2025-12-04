"use client";

import { useEffect, useState } from "react";
import { useCartPopup } from "@/context/ShopContext";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { Squash } from "hamburger-react";
import { CartItem } from "@/types/shop";
import styles from "@/styles/components/shop/Cart.module.css";

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

  function findOptionValue(options?: Record<string, string>, possibleKeys: string[] = []) {
    if (!options) return undefined;

    const normalized: Record<string, string> = {};
    for (const k of Object.keys(options)) {
      normalized[k.trim().toLowerCase()] = options[k];
    }

    for (const key of possibleKeys) {
      const found = normalized[key.toLowerCase()];
      if (found) return found;
    }

    return undefined;
  }

  function parseLabelForOptions(label?: string) {
    if (!label) return { color: undefined, size: undefined, rest: label || "" };
    const obj: Record<string, string> = {};
    const parts = label.split(/\||,/).map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      if (!k) continue;
      const v = rest.join(":").trim();
      obj[k.trim().toLowerCase()] = v;
    }
    return { color: obj["cor"] || obj["color"], size: obj["tamanho"] || obj["size"], rest: label };
  }

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
                      {variantObj && (
                        <div className={styles.variantRow}>
                          {(() => {
                            const color =
                              findOptionValue(variantObj.options, ["cor", "color"]) ||
                              parseLabelForOptions(variantObj.label).color;
                            const size = findOptionValue(variantObj.options, ["tamanho", "size"]);

                            return (
                              <>
                                {color && (
                                  <span
                                    className={styles.colorDot}
                                    style={{ backgroundColor: color }}
                                  />
                                )}

                                {size && <span className={styles.sizeTag}>{size}</span>}
                              </>
                            );
                          })()}
                          <span className={styles.priceTag}>{price.toFixed(2)}€</span>
                          <button onClick={() => handleRemove(idx)} className={styles.trashBtn}>
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
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
