"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product, CartItem } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";
import { FiChevronDown } from "react-icons/fi";
import { getColorFromOptions, isColorKey } from "@/utils/shopUtils";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const optionNames = useMemo(() => {
    const all = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.options || {}).forEach((k) => all.add(k)));
    return Array.from(all);
  }, [product.variants]);

  const mainOption = optionNames[0] || "";
  const subOption = optionNames[1] || "";
  const normalize = (val?: string) => (val ? val.replace(/['"\\]/g, "").trim() : "");

  const mainValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      const raw = v.options?.[mainOption];
      if (!raw) return;
      const cleanValue = normalize(raw);
      set.add(cleanValue);
    });
    return Array.from(set);
  }, [product.variants, mainOption]);

  const [selectedMain, setSelectedMain] = useState(mainValues[0] || "");
  const subValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (
        normalize(v.options?.[mainOption]) === normalize(selectedMain) &&
        v.options?.[subOption]
      ) {
        set.add(normalize(v.options[subOption]));
      }
    });
    return Array.from(set);
  }, [product.variants, mainOption, subOption, selectedMain]);

  const [selectedSub, setSelectedSub] = useState(subValues[0] || "");
  const [qty, setQty] = useState(1);

  const allImages = useMemo(() => {
    const imgSet = new Set<string>();
    product.images.forEach((img) => imgSet.add(img));
    product.variants.forEach((v) => (v.images ?? []).forEach((img) => imgSet.add(img)));
    return Array.from(imgSet);
  }, [product]);

  const getVariantImageIndex = (variant?: (typeof product.variants)[0]) => {
    if (!variant?.images?.length) return 0;
    const firstImg = variant.images[0];
    const idx = allImages.indexOf(firstImg);
    return idx >= 0 ? idx : 0;
  };

  const [imgIndex, setImgIndex] = useState(0);

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => {
      const mainValue = normalize(v.options?.[mainOption]);
      const subValue = normalize(v.options?.[subOption]);
      return mainValue === normalize(selectedMain) && subValue === normalize(selectedSub);
    });
  }, [product.variants, mainOption, subOption, selectedMain, selectedSub]);

  const price = useMemo(() => {
    return (product.price || 0) + (selectedVariant?.price_modifier || 0);
  }, [product.price, selectedVariant]);

  const addToCart = () => {
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      product,
      variantId: selectedVariant?.id,
      quantity: qty,
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/shop");
  };

  const handleMainChange = (val: string) => {
    setSelectedMain(val);
    const newSub = product.variants.find(
      (v) => normalize(v.options?.[mainOption]) === normalize(val)
    )?.options?.[subOption];
    setSelectedSub(normalize(newSub) || "");
    const newVariant = product.variants.find((v) => {
      const mainValue = normalize(v.options?.[mainOption]);
      const subValue = normalize(v.options?.[subOption]);
      return mainValue === normalize(val) && subValue === normalize(newSub || "");
    });
    setImgIndex(getVariantImageIndex(newVariant));
  };

  const handleSubChange = (val: string) => {
    setSelectedSub(val);
    const newVariant = product.variants.find((v) => {
      const mainValue = normalize(v.options?.[mainOption]);
      const subValue = normalize(v.options?.[subOption]);
      return mainValue === normalize(selectedMain) && subValue === normalize(val);
    });
    setImgIndex(getVariantImageIndex(newVariant));
  };

  const canBuy =
    product.variants.length === 0 ||
    (selectedVariant &&
      selectedVariant.active &&
      (product.stock_type !== "limited" || (selectedVariant.stock_quantity ?? 0) > 0));
  const isColorOption = isColorKey(mainOption);

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
        <div className={styles.imageSection}>
          <Image
            src={allImages[imgIndex]}
            alt={product.name}
            width={600}
            height={800}
            className={styles.mainImage}
            priority
          />
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
        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>{price.toFixed(2)}€</div>
          <p className={styles.description}>{product.description}</p>
          {mainOption && (
            <div>
              <span className={styles.label}>{mainOption}</span>
              <div className={isColorOption ? styles.colorOptions : styles.options}>
                {mainValues.map((val) => {
                  const color = getColorFromOptions({ [mainOption]: val }, undefined);
                  const colorHex = color.hex;
                  const colorName = color.name ?? val;
                  const isSelected = normalize(selectedMain) === normalize(val);

                  if (isColorOption) {
                    return (
                      <button
                        key={val}
                        className={`${styles.option} ${isSelected ? styles.selected : ""}`}
                        style={{
                          backgroundColor: colorHex || undefined,
                        }}
                        onClick={() => handleMainChange(val)}
                        title={colorName}
                        aria-label={colorName}
                        aria-pressed={isSelected}></button>
                    );
                  }

                  return (
                    <button
                      key={val}
                      className={`${styles.option} ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleMainChange(val)}
                      aria-label={`Select ${val}`}>
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {subOption && (
            <div>
              <span className={styles.label}>{subOption}</span>
              <div className={styles.options}>
                {subValues.map((val) => (
                  <button
                    key={val}
                    className={`${styles.option} ${selectedSub === val ? styles.selected : ""}`}
                    onClick={() => handleSubChange(val)}
                    disabled={
                      !product.variants.some((v) => {
                        const mainValue = normalize(v.options?.[mainOption]);
                        const subValue = normalize(v.options?.[subOption]);
                        return (
                          mainValue === normalize(selectedMain) &&
                          subValue === val &&
                          v.active &&
                          (product.stock_type === "on_demand" || (v.stock_quantity ?? 0) > 0)
                        );
                      })
                    }
                    aria-label={`Select size ${val}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}
          <span className={styles.label}>Quantidade</span>
          <div className={styles.qtyAndButton}>
            <div className={styles.quantity}>
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity">
                -
              </button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                +
              </button>
            </div>
            <button className={styles.addButton} onClick={addToCart} disabled={!canBuy}>
              Adicionar ao Carrinho
            </button>
          </div>
          <div className={styles.asideDetails}>
            <details className={styles.detailsBlock}>
              <summary>
                <span>Size Guide</span>
                <FiChevronDown className={styles.detailIcon} aria-hidden />
              </summary>
              <p>Check our size guide for detailed measurements.</p>
            </details>
            <details className={styles.detailsBlock}>
              <summary>
                <span>Quality Guarantee & Returns</span>
                <FiChevronDown className={styles.detailIcon} aria-hidden />
              </summary>
              <p>All products come with our quality guarantee. Returns accepted within 30 days.</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
