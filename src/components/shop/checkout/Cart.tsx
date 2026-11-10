"use client";

import { useEffect, useState } from "react";
import { useCartPopup } from "@/context/ShopContext";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { Squash } from "hamburger-react";
import { CartItem } from "@/types/shop/product";
import styles from "@/styles/components/shop/checkout/Cart.module.css";
import { getColorFromOptions, findItemVariant, getItemImage } from "@/utils/shop/shopUtils";
import VariantTags from "@/components/shop/VariantTags";
import { formatMoney, unitPriceMoney, lineTotalMoney, addMoney } from "@/utils/shop/moneyUtils";
import type { Dictionary } from "@/i18n/dictionaries";

function getItemPrice(item: CartItem): number {
  const variant = item.variantId
    ? item.product.variants.find((v) => v.id === item.variantId)
    : undefined;
  return unitPriceMoney(item.product.price, variant?.price_modifier);
}

interface CartProps {
  dict: Dictionary["cart"];
  basePath: string;
}

export default function Cart({ dict, basePath }: CartProps) {
  const { isOpen, closeCart } = useCartPopup();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const load = () => setCartItems(JSON.parse(localStorage.getItem("cart") || "[]"));
    load();
    window.addEventListener("cartUpdated", load);
    return () => window.removeEventListener("cartUpdated", load);
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = prev || "";
      document.body.style.touchAction = prevTouch || "";
    }
    return () => {
      document.body.style.overflow = prev || "";
      document.body.style.touchAction = prevTouch || "";
    };
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
    (sum, item) => addMoney(sum, lineTotalMoney(getItemPrice(item), 0, item.quantity)),
    0
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeCart} role="dialog" aria-modal="true">
      <div className={styles.cart} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={closeCart} aria-label={dict.close_label}>
          <Squash toggled={true} size={24} />
        </button>

        <h2>{dict.title}</h2>

        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <p className={styles.empty}>{dict.empty}</p>
          ) : (
            cartItems.map((item, idx) => {
              const variantObj = findItemVariant(item.product, {
                variant_id: item.variantId,
              });
              const price = getItemPrice(item);
              const imageSrc = getItemImage(item.product, variantObj);
              const colorInfo = getColorFromOptions(
                variantObj?.options ?? undefined,
                variantObj?.label ?? undefined
              );

              const isEventTicket = item.product.product_type === "event_ticket";

              let maxQty = 99;
              if (item.product.stock_type === "limited") {
                maxQty =
                  item.product.variants.length === 0
                    ? (item.product.stock_quantity ?? 0)
                    : (variantObj?.stock_quantity ?? 0);
              }

              return (
                <div
                  key={`${item.product.id}-${item.variantId ?? "default"}`}
                  className={styles.item}>
                  <div className={styles.imageWrapper}>
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={item.product.name}
                        fill
                        className={styles.productImage}
                      />
                    ) : null}
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
                        <VariantTags options={variantObj?.options} className={styles.sizeTag} />

                        <span className={styles.priceTag}>{formatMoney(price)}</span>

                        <button onClick={() => handleRemove(idx)} className={styles.trashBtn}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <div className={styles.quantityWrapper}>
                      <div className={styles.quantityBox}>
                        <button onClick={() => handleQuantity(idx, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantity(idx, 1)}
                          disabled={
                            isEventTicket ||
                            (item.product.stock_type === "limited" && item.quantity >= maxQty)
                          }>
                          +
                        </button>
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
            <span>{dict.total} </span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <button
            disabled={cartItems.length === 0}
            onClick={() => {
              closeCart();
              window.location.href = `${basePath}/shop/checkout`;
            }}>
            {dict.checkout}
          </button>
        </div>
      </div>
    </div>
  );
}
