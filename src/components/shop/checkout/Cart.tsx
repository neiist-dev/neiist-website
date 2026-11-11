"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { Button, Drawer, EmptyState, Stack } from "@neiist/ui";
import { useCartPopup } from "@/context/ShopContext";
import { CartItem } from "@/types/shop/product";
import VariantTags from "@/components/shop/VariantTags";
import {
  getCartItemVariant,
  getCartItemUnitPrice,
  getProductStock,
  calculateCartSubtotal,
  getItemImage,
} from "@/utils/shop/shopUtils";
import { formatMoney } from "@/utils/shop/moneyUtils";
import styles from "@/styles/components/shop/checkout/Cart.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

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

  const persistCart = (updater: (_prev: CartItem[]) => CartItem[]) => {
    setCartItems((prev) => {
      const next = updater(prev);
      localStorage.setItem("cart", JSON.stringify(next));
      setTimeout(() => window.dispatchEvent(new Event("cartUpdated")), 0);
      return next;
    });
  };

  const handleRemove = (idx: number) => {
    persistCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuantity = (idx: number, delta: number) => {
    persistCart((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const total = calculateCartSubtotal(cartItems);

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title={dict.title}
      closeLabel={dict.close_label}
      position="right"
      size="md">
      <Drawer.Body>
        {cartItems.length === 0 ? (
          <EmptyState title={dict.empty} />
        ) : (
          cartItems.map((item, idx) => {
            const variantObj = getCartItemVariant(item);
            const price = getCartItemUnitPrice(item);
            const imageSrc = getItemImage(item.product, variantObj);
            const isEventTicket = item.product.product_type === "event_ticket";

            const stock = getProductStock(item.product, variantObj);

            return (
              <div
                key={`${item.product.id}-${item.variantId ?? "default"}`}
                className={styles.item}>
                <div className={styles.imageWrapper}>
                  {imageSrc && (
                    <Image
                      src={imageSrc}
                      alt={item.product.name}
                      fill
                      className={styles.productImage}
                    />
                  )}
                </div>

                <Stack direction="column" gap="sm" className={styles.itemBody}>
                  <h4>{item.product.name}</h4>

                  <Stack direction="row" align="center" gap="sm" className={styles.variantRow}>
                    <VariantTags
                      options={variantObj?.options}
                      label={variantObj?.label}
                      showColorSwatch
                    />
                    <span className={styles.priceTag}>{formatMoney(price)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      color="danger"
                      size="sm"
                      className={styles.iconBtn}
                      onClick={() => handleRemove(idx)}>
                      <FiTrash2 size={14} />
                    </Button>
                  </Stack>

                  <div>
                    <div className={styles.quantityBox}>
                      <Button
                        type="button"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        className={styles.iconBtn}
                        onClick={() => handleQuantity(idx, -1)}>
                        <FiMinus size={12} />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        className={styles.iconBtn}
                        onClick={() => handleQuantity(idx, 1)}
                        disabled={isEventTicket || (stock !== null && item.quantity >= stock)}>
                        <FiPlus size={12} />
                      </Button>
                    </div>
                  </div>
                </Stack>
              </div>
            );
          })
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Stack direction="column" gap="md" className={styles.footerContent}>
          <Stack direction="row" justify="between" align="center">
            <span>{dict.total}</span>
            <strong>{formatMoney(total)}</strong>
          </Stack>
          <Button
            variant="primary"
            size="lg"
            shape="pill"
            fullWidth
            disabled={cartItems.length === 0}
            onClick={() => {
              closeCart();
              window.location.href = `${basePath}/shop/checkout`;
            }}>
            {dict.checkout}
          </Button>
        </Stack>
      </Drawer.Footer>
    </Drawer>
  );
}
