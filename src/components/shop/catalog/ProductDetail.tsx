"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { FiChevronDown, FiImage } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Product, CartItem } from "@/types/shop/product";
import styles from "@/styles/components/shop/catalog/ProductDetail.module.css";
import {
  getColorFromOptions,
  isColorKey,
  getProductUnavailableReason,
  isProductUpcoming,
  isProductDeadlinePassed,
  getProductImages,
} from "@/utils/shop/shopUtils";
import SizeGuideOverlay from "@/components/shop/catalog/SizeGuideOverlay";
import ReactMarkdown from "react-markdown";
import { Alert } from "@neiist/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatMoney, unitPriceMoney } from "@/utils/shop/moneyUtils";

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

  const normalize = (val?: string) => (val ? val.replace(/['"\\]/g, "").trim() : "");

  const optionNames = useMemo(() => {
    return Array.from(new Set(product.variants.flatMap((v) => Object.keys(v.options || {}))));
  }, [product.variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    optionNames.forEach((name) => {
      init[name] = normalize(product.variants[0]?.options?.[name]);
    });
    return init;
  });

  const availableValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    optionNames.forEach((name, idx) => {
      const priorOptions = optionNames.slice(0, idx);
      const matching = product.variants.filter((v) =>
        priorOptions.every((prior) => normalize(v.options?.[prior]) === normalize(selected[prior]))
      );
      const seen = new Set<string>();
      const values: string[] = [];
      matching.forEach((v) => {
        const val = normalize(v.options?.[name]);
        if (val && !seen.has(val)) {
          seen.add(val);
          values.push(val);
        }
      });
      result[name] = values;
    });
    return result;
  }, [product.variants, optionNames, selected]);

  useEffect(() => {
    setSelected((prev) => {
      const next = { ...prev };
      let changed = false;
      optionNames.forEach((name) => {
        const vals = availableValues[name] ?? [];
        if (vals.length > 0 && !vals.includes(prev[name])) {
          next[name] = vals[0];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [availableValues, optionNames]);

  const handleSelect = useCallback((optionName: string, value: string) => {
    setSelected((prev) => ({ ...prev, [optionName]: value }));
  }, []);

  const selectedVariant = useMemo(() => {
    if (optionNames.length === 0) return undefined;
    return product.variants.find((v) =>
      optionNames.every((name) => normalize(v.options?.[name]) === normalize(selected[name]))
    );
  }, [product.variants, optionNames, selected]);

  const allImages = useMemo(() => getProductImages(product), [product]);

  const getVariantImageIndex = useCallback(
    (variant?: Product["variants"][0]): number => {
      if (!variant?.images?.length) return 0;
      const idx = allImages.indexOf(variant.images[0]);
      return idx >= 0 ? idx : 0;
    },
    [allImages]
  );

  const [imgIndex, setImgIndex] = useState(() => getVariantImageIndex(product.variants[0]));

  useEffect(() => {
    setImgIndex(getVariantImageIndex(selectedVariant));
  }, [selectedVariant, getVariantImageIndex]);

  const price = useMemo(() => {
    return unitPriceMoney(product.price, selectedVariant?.price_modifier);
  }, [product.price, selectedVariant]);

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

  const maxQty = useMemo(() => {
    if (product.stock_type !== "limited") return 99;
    if (product.variants.length === 0) return product.stock_quantity ?? 0;
    return selectedVariant?.stock_quantity ?? 0;
  }, [product, selectedVariant]);

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
                    const isSelected = normalize(selected[optionName]) === normalize(val);
                    const hasAvailable = product.variants.some((v) => {
                      const priorMatch = priorOptions.every(
                        (prior) => normalize(v.options?.[prior]) === normalize(selected[prior])
                      );
                      return (
                        priorMatch &&
                        normalize(v.options?.[optionName]) === normalize(val) &&
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
                disabled={isEventTicket || (product.stock_type === "limited" && qty >= maxQty)}>
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
