"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { FiChevronDown, FiImage } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Product, CartItem } from "@/types/shop/product";
import styles from "@/styles/components/shop/catalog/ProductDetail.module.css";
import {
  getColorFromOptions,
  getProductStock,
  isColorKey,
  getProductUnavailableReason,
  isProductUpcoming,
  isProductDeadlinePassed,
  normalizeOptionValue,
} from "@/utils/shop/shopUtils";
import { useVariantSelection } from "@/hooks/shop/useVariantSelection";
import SizeGuideOverlay from "@/components/shop/catalog/SizeGuideOverlay";
import ReactMarkdown from "react-markdown";
import { Alert } from "@neiist/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMoney } from "@/utils/shop/moneyUtils";

interface ProductDetailProps {
  product: Product;
  dict: Dictionary["shop"];
  basePath?: string;
}

export default function ProductDetail({ product, dict, basePath }: ProductDetailProps) {
  const router = useRouter();
  const isEventTicket = product.product_type === "event_ticket";
  const unavailableToastId = `product-detail-unavailable-${product.id}`;

  useEffect(() => {
    return () => {
      Alert.dismiss(unavailableToastId);
    };
  }, [unavailableToastId]);

  const {
    optionNames,
    selected,
    availableValues,
    handleSelect,
    selectedVariant,
    allImages,
    imgIndex,
    setImgIndex,
    price,
  } = useVariantSelection(product);

  const isOrderNotStarted = isProductUpcoming(product);
  const isDeadlineExpired = isProductDeadlinePassed(product);

  const isVariantAvailable = useCallback(
    (v: (typeof product.variants)[0]) =>
      v.active && (product.stock_type !== "limited" || (v.stock_quantity ?? 0) > 0),
    [product]
  );

  const unavailableReason = useMemo(
    () => getProductUnavailableReason(product, selectedVariant, dict),
    [product, selectedVariant, dict]
  );

  const canBuy = !unavailableReason;

  const stock = useMemo(
    () => getProductStock(product, selectedVariant),
    [product, selectedVariant]
  );
  const maxQty = stock ?? Infinity;

  const [qty, setQty] = useState(1);
  useEffect(() => {
    setQty(1);
  }, [selectedVariant]);

  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const addToCart = () => {
    if (unavailableReason) {
      Alert.error(unavailableReason, { duration: Infinity });
      return;
    }
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    if (isEventTicket) {
      localStorage.setItem(
        "cart",
        JSON.stringify([{ product, variantId: selectedVariant?.id, quantity: 1 }])
      );
      window.dispatchEvent(new Event("cartUpdated"));
      router.push(`${basePath || ""}/shop/checkout`);
      return;
    }

    cart.push({ product, variantId: selectedVariant?.id, quantity: qty });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push(`${basePath || ""}/shop`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbs}>
        <span
          onClick={() => router.push(`${basePath || ""}/shop`)}
          className={styles.breadcrumbLink}>
          {dict.breadcrumbs.shop}
        </span>
        <span className={styles.breadcrumbSeparator}>››</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.imageSection}>
          {allImages.length > 0 ? (
            <Image
              src={allImages[imgIndex] ?? allImages[0]}
              alt={product.name}
              width={600}
              height={800}
              className={styles.mainImage}
              priority
            />
          ) : (
            <div className={`${styles.mainImage} ${styles.noImage}`}>
              <FiImage size={64} />
              <span>{dict.no_image_label}</span>
            </div>
          )}
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((src, i) => (
                <button
                  key={src}
                  className={`${styles.thumbnail} ${i === imgIndex ? styles.active : ""}`}
                  onClick={() => setImgIndex(i)}
                  aria-label={`View image ${i + 1}`}>
                  <Image src={src} alt="" width={80} height={80} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>{formatMoney(price)}</div>
          <div className={styles.description}>
            <ReactMarkdown
              components={{
                a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}>
              {product.description}
            </ReactMarkdown>
          </div>

          {optionNames.map((optionName, idx) => {
            const isColor = isColorKey(optionName);
            const values = availableValues[optionName] ?? [];
            const priorOptions = optionNames.slice(0, idx);
            return (
              <div key={optionName}>
                <span className={styles.label}>{optionName}</span>
                <div className={isColor ? styles.colorOptions : styles.options}>
                  {values.map((val) => {
                    const isSelected =
                      normalizeOptionValue(selected[optionName]) === normalizeOptionValue(val);
                    const hasAvailable = product.variants.some((v) => {
                      const priorMatch = priorOptions.every(
                        (prior) =>
                          normalizeOptionValue(v.options?.[prior]) ===
                          normalizeOptionValue(selected[prior])
                      );
                      return (
                        priorMatch &&
                        normalizeOptionValue(v.options?.[optionName]) ===
                          normalizeOptionValue(val) &&
                        isVariantAvailable(v)
                      );
                    });

                    if (isColor) {
                      const color = getColorFromOptions({ [optionName]: val }, undefined);
                      return (
                        <button
                          key={val}
                          className={[
                            styles.option,
                            isSelected ? styles.selected : "",
                            !hasAvailable ? styles.unavailable : "",
                          ].join(" ")}
                          style={{ backgroundColor: color.hex || undefined }}
                          onClick={() => handleSelect(optionName, val)}
                          title={color.name ?? val}
                          aria-label={color.name ?? val}
                          aria-pressed={isSelected}
                        />
                      );
                    }

                    return (
                      <button
                        key={val}
                        className={[
                          styles.option,
                          isSelected ? styles.selected : "",
                          !hasAvailable ? styles.unavailable : "",
                        ].join(" ")}
                        onClick={() => handleSelect(optionName, val)}
                        disabled={!hasAvailable}
                        aria-label={`Select ${optionName} ${val}`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <span className={styles.label}>{dict.labels.quantity}</span>
          <div className={styles.qtyAndButton}>
            <div className={`${styles.quantity} ${isEventTicket ? styles.quantityDisabled : ""}`}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={isEventTicket}>
                -
              </button>
              <span>{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={isEventTicket || (stock !== null && qty >= stock)}>
                +
              </button>
            </div>
            <div
              className={styles.addButtonWrapper}
              onClick={() => {
                if (!canBuy) addToCart();
              }}>
              <button className={styles.addButton} onClick={addToCart} disabled={!canBuy}>
                {isOrderNotStarted
                  ? dict.buttons.coming_soon
                  : isDeadlineExpired
                    ? dict.buttons.unavailable
                    : isEventTicket
                      ? dict.buttons.buy_now
                      : dict.buttons.add_to_cart}
              </button>
            </div>
          </div>

          {(product.size_guide || product.estimated_delivery) && (
            <div className={styles.asideDetails}>
              {product.size_guide && (
                <>
                  <details className={styles.detailsBlock}>
                    <summary>
                      <span>{dict.size_guide_title}</span>
                      <FiChevronDown className={styles.detailIcon} aria-hidden />
                    </summary>
                    <p>
                      {dict.size_guide_text.split("{link}")[0]}
                      <a
                        href="#"
                        className={styles.sizeGuideLink}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowSizeGuide(true);
                        }}>
                        {dict.size_guide_link}
                      </a>
                      {dict.size_guide_text.split("{link}")[1]}
                    </p>
                  </details>
                  <SizeGuideOverlay
                    open={showSizeGuide}
                    onClose={() => setShowSizeGuide(false)}
                    title={product.name ? `${dict.size_guide_title} ${product.name}` : undefined}
                    customContent={product.size_guide}
                  />
                </>
              )}

              {product.estimated_delivery && (
                <details className={styles.detailsBlock}>
                  <summary>
                    <span>{dict.delivery_title}</span>
                    <FiChevronDown className={styles.detailIcon} aria-hidden />
                  </summary>
                  <p>{product.estimated_delivery}</p>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
