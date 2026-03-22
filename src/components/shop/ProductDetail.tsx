"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product, CartItem } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";
import { FiChevronDown } from "react-icons/fi";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";
import SizeGuideOverlay from "@/components/shop/SizeGuideOverlay";
import { toast } from "sonner";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const unavailableToastId = `product-detail-unavailable-${product.id}`;

  useEffect(() => {
    return () => {
      toast.dismiss(unavailableToastId);
    };
  }, [unavailableToastId]);

  const normalize = (val?: string) => (val ? val.replace(/['"\\]/g, "").trim() : "");

  // ── All option type names, in stable insertion order ────────────────────
  const optionNames = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    product.variants.forEach((v) => {
      Object.keys(v.options || {}).forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k);
          result.push(k);
        }
      });
    });
    return result;
  }, [product.variants]);

  // ── Selected values map: { [optionName]: selectedValue } ────────────────
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    optionNames.forEach((name) => {
      init[name] = normalize(product.variants[0]?.options?.[name]);
    });
    return init;
  });

  // ── Available values per option, filtered by all prior selections ────────
  // e.g. sizes available are only those that exist for the selected color
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

  // When available values change, reset any selection that's no longer in the list
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

  // ── Resolve the currently selected variant ───────────────────────────────
  const selectedVariant = useMemo(() => {
    if (optionNames.length === 0) return undefined;
    return product.variants.find((v) =>
      optionNames.every((name) => normalize(v.options?.[name]) === normalize(selected[name]))
    );
  }, [product.variants, optionNames, selected]);

  // ── Images ───────────────────────────────────────────────────────────────
  const allImages = useMemo(() => {
    const result: string[] = [...product.images];
    const inResult = new Set(result);
    product.variants.forEach((v) => {
      (v.images ?? []).forEach((img) => {
        if (!inResult.has(img)) {
          result.push(img);
          inResult.add(img);
        }
      });
    });
    return result;
  }, [product]);

  const getVariantImageIndex = useCallback(
    (variant?: (typeof product.variants)[0]): number => {
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

  // ── Price ────────────────────────────────────────────────────────────────
  const price = useMemo(() => {
    return (product.price || 0) + (selectedVariant?.price_modifier || 0);
  }, [product.price, selectedVariant]);

  // ── Stock / availability ─────────────────────────────────────────────────
  const isDeadlineExpired =
    product.stock_type === "on_demand" &&
    !!product.order_deadline &&
    new Date(product.order_deadline) < new Date();

  const isVariantAvailable = useCallback(
    (v: (typeof product.variants)[0]) =>
      v.active && (product.stock_type !== "limited" || (v.stock_quantity ?? 0) > 0),
    [product.stock_type]
  );

  const canBuy = useMemo(() => {
    if (isDeadlineExpired) return false;
    if (product.variants.length === 0)
      return product.stock_type !== "limited" || (product.stock_quantity ?? 0) > 0;
    return !!selectedVariant && isVariantAvailable(selectedVariant);
  }, [isDeadlineExpired, product, selectedVariant, isVariantAvailable]);

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
    if (!canBuy) {
      toast.error(
        isDeadlineExpired
          ? "O prazo de encomenda deste produto já terminou."
          : "Este produto já não está disponível para compra.",
        { id: unavailableToastId, duration: Infinity }
      );
      return;
    }
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ product, variantId: selectedVariant?.id, quantity: qty });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/shop");
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbs}>
        <span onClick={() => router.push("/shop")} className={styles.breadcrumbLink}>
          Store
        </span>
        <span className={styles.breadcrumbSeparator}>››</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div className={styles.grid}>
        {/* ── Images ── */}
        <div className={styles.imageSection}>
          {allImages.length > 0 && (
            <Image
              src={allImages[imgIndex] ?? allImages[0]}
              alt={product.name}
              width={600}
              height={800}
              className={styles.mainImage}
              priority
            />
          )}
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((src, i) => (
                <button
                  key={i}
                  className={`${styles.thumbnail} ${i === imgIndex ? styles.active : ""}`}
                  onClick={() => setImgIndex(i)}
                  aria-label={`View image ${i + 1}`}>
                  <Image src={src} alt="" width={80} height={80} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>{price.toFixed(2)}€</div>
          <p className={styles.description}>{product.description}</p>

          {/* ── Dynamic N-option selectors ── */}
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

                    // Available if at least one variant matching all prior options
                    // + this value is in stock and active
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

          {/* ── Quantity + Add to cart ── */}
          <span className={styles.label}>Quantidade</span>
          <div className={styles.qtyAndButton}>
            <div className={styles.quantity}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity">
                -
              </button>
              <span>{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={product.stock_type === "limited" && qty >= maxQty}
                aria-label="Increase quantity">
                +
              </button>
            </div>
            <div
              className={styles.addButtonWrapper}
              onClick={() => {
                if (!canBuy) addToCart();
              }}>
              <button className={styles.addButton} onClick={addToCart} disabled={!canBuy}>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* ── Aside details ── */}
          <div className={styles.asideDetails}>
            <details className={styles.detailsBlock}>
              <summary>
                <span>Guia de Tamanhos</span>
                <FiChevronDown className={styles.detailIcon} aria-hidden />
              </summary>
              <p>
                Vê o nosso{" "}
                <a
                  href="#"
                  className={styles.sizeGuideLink}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSizeGuide(true);
                  }}>
                  Guia de Tamanhos
                </a>{" "}
                para mais detalhes.
              </p>
            </details>
            <SizeGuideOverlay open={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
            <details className={styles.detailsBlock}>
              <summary>
                <span>Prazos de Entrega</span>
                <FiChevronDown className={styles.detailIcon} aria-hidden />
              </summary>
              <p>
                Encomenda até 25 de Dezembro para receberes entre 20 e 25 de Janeiro. Pedidos após
                esta data terão um tempo de espera superior.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
