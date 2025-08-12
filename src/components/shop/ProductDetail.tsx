"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Image from "next/image";
import { Product, ProductVariant } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  const variantGroups = product.variants.reduce(
    (groups, variant) => {
      if (!groups[variant.variant_name]) {
        groups[variant.variant_name] = [];
      }
      groups[variant.variant_name].push(variant);
      return groups;
    },
    {} as Record<string, ProductVariant[]>
  );

  useEffect(() => {
    const images: string[] = [];

    if (product.images && product.images.length > 0) {
      images.push(product.images[0]);
    }

    Object.entries(selectedVariants).forEach(([variantType, variantValue]) => {
      const variant = product.variants.find(
        (v) => v.variant_name === variantType && v.variant_value === variantValue
      );
      if (variant?.images && variant.images.length > 0 && !images.includes(variant.images[0])) {
        images.push(variant.images[0]);
      }
    });

    if (Object.keys(selectedVariants).length === 0) {
      product.variants.forEach((variant) => {
        if (variant.images && variant.images.length > 0 && !images.includes(variant.images[0])) {
          images.push(variant.images[0]);
        }
      });
    }

    setAvailableImages(images);

    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [selectedVariants, product, selectedImageIndex]);

  const getFinalPrice = () => {
    let price = product.price;
    Object.values(selectedVariants).forEach((variantValue) => {
      const variant = product.variants.find((v) => v.variant_value === variantValue);
      if (variant) {
        price += variant.price_modifier;
      }
    });
    return price;
  };

  const handleVariantSelect = (variantType: string, variantValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantType]: variantValue,
    }));

    setSelectedImageIndex(0);
  };

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const variantInfo = Object.entries(selectedVariants)
      .map(([type, value]) => `${type}: ${value}`)
      .join(", ");

    cart.push({
      productId: product.id,
      name: product.name,
      price: getFinalPrice(),
      image: availableImages[0] || product.images[0],
      quantity: quantity,
      variant: variantInfo || undefined,
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    router.push("/shop");
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % availableImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        ← Voltar à Loja
      </button>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            {availableImages.length > 1 && (
              <button className={styles.navBtn} onClick={prevImage}>
                <FaArrowLeft />
              </button>
            )}
            {availableImages[selectedImageIndex] ? (
              <Image
                src={availableImages[selectedImageIndex]}
                alt={product.name}
                width={400}
                height={400}
                className={styles.productImage}
              />
            ) : (
              <div className={styles.productImage}>Nenhuma imagem</div>
            )}
            {availableImages.length > 1 && (
              <button className={styles.navBtn} onClick={nextImage}>
                <FaArrowRight />
              </button>
            )}
          </div>

          {availableImages.length > 1 && (
            <div className={styles.thumbnails}>
              {availableImages.map((image, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.active : ""}`}
                  onClick={() => setSelectedImageIndex(index)}>
                  {image ? (
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className={styles.thumbnailImg}
                    />
                  ) : (
                    <div className={styles.thumbnailImg}>Nenhuma imagem</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.productInfo}>
          <h1 className={styles.productName}>{product.name}</h1>
          <div className={styles.price}>{getFinalPrice()}€</div>

          {Object.entries(variantGroups).map(([variantType, variants]) => (
            <div key={variantType} className={styles.variantGroup}>
              <h3 className={styles.variantTitle}>{variantType.toUpperCase()}</h3>
              <div className={styles.variantOptions}>
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`${styles.variantOption} ${
                      selectedVariants[variantType] === variant.variant_value ? styles.selected : ""
                    }`}
                    onClick={() => handleVariantSelect(variantType, variant.variant_value)}
                    disabled={!variant.active || (variant.stock_quantity || 0) <= 0}>
                    {variant.variant_value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.description}>{product.description}</div>

          <div className={styles.quantitySection}>
            <label className={styles.quantityLabel}>Quantidade</label>
            <div className={styles.quantityControls}>
              <button
                className={styles.quantityBtn}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button className={styles.quantityBtn} onClick={() => setQuantity(quantity + 1)}>
                +
              </button>
            </div>
          </div>

          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart}
            disabled={
              Object.keys(variantGroups).length > 0 &&
              Object.keys(selectedVariants).length !== Object.keys(variantGroups).length
            }>
            + Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}
