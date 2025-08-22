"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import type { Swiper as SwiperType } from "swiper";
import ProductCard from "@/components/shop/ProductCard";
import { Product, ProductVariant } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";
import carouselStyles from "@/styles/components/shop/ShopProductList.module.css";

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
}

export default function ProductDetail({ product, allProducts }: ProductDetailProps) {
  const router = useRouter();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [imgIndex, setImgIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const variantGroups: Record<string, ProductVariant[]> = useMemo(
    () =>
      (product.variants || []).reduce(
        (variantMap, varient) => {
          (variantMap[varient.variant_name] ||= []).push(varient);
          return variantMap;
        },
        {} as Record<string, ProductVariant[]>
      ),
    [product.variants]
  );

  const images = useMemo(() => {
    const base: string[] = [];
    if (product.images?.length) base.push(product.images[0]);
    Object.entries(selectedVariants).forEach(([variantType, selectedValue]) => {
      const varients = product.variants?.find(
        (currentVariant) =>
          currentVariant.variant_name === variantType &&
          currentVariant.variant_value === selectedValue &&
          currentVariant.images?.length
      );
      if (varients?.images?.[0] && !base.includes(varients.images[0]))
        base.push(varients.images[0]);
    });
    if (!Object.keys(selectedVariants).length && product.variants) {
      product.variants.forEach((varient) => {
        if (varient.images?.[0] && !base.includes(varient.images[0])) base.push(varient.images[0]);
      });
    }
    return base;
  }, [product, selectedVariants]);

  const price = useMemo(() => {
    let itemPrice = product.price;
    Object.values(selectedVariants).forEach((variantSelection) => {
      const selectedVariant = product.variants?.find(
        (productVariant) => productVariant.variant_value === variantSelection
      );
      if (selectedVariant) itemPrice += selectedVariant.price_modifier;
    });
    return itemPrice;
  }, [product, selectedVariants]);

  const related = useMemo(
    () =>
      allProducts.filter(
        (currentProduct) =>
          currentProduct.id !== product.id &&
          (currentProduct.category === product.category ||
            (product.variants?.length &&
              currentProduct.variants?.some((variant) =>
                product.variants?.some(
                  (productVariant) =>
                    productVariant.variant_name === variant.variant_name &&
                    productVariant.variant_value === variant.variant_value
                )
              )))
      ),
    [allProducts, product]
  );

  const selectVariant = (type: string, value: string) => {
    setSelectedVariants((prev) => ({ ...prev, [type]: value }));
    setImgIndex(0);
  };

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      productId: product.id,
      name: product.name,
      price,
      image: images[0] || product.images[0],
      quantity: qty,
      variant:
        Object.keys(selectedVariants).length === 0
          ? undefined
          : Object.entries(selectedVariants)
              .map(([t, v]) => `${t}: ${v}`)
              .join(", "),
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    router.push("/shop");
  };

  const allVariantsChosen =
    Object.keys(variantGroups).length === 0 ||
    Object.keys(selectedVariants).length === Object.keys(variantGroups).length;

  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const showArrows = related.length > 3;
  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.push("/shop")}>
        <IoIosArrowBack size={18} /> Voltar
      </button>

      <div className={styles.grid}>
        <div className={styles.imageSection}>
          {images.length > 1 && (
            <button
              className={styles.imageArrowLeft}
              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}>
              <IoIosArrowBack size={26} />
            </button>
          )}

          <Image
            src={images[imgIndex] || "/placeholder.jpg"}
            alt={product.name}
            width={600}
            height={600}
            className={styles.mainImage}
          />

          {images.length > 1 && (
            <button
              className={styles.imageArrowRight}
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}>
              <IoIosArrowForward size={26} />
            </button>
          )}

          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`${styles.thumbnail} ${i === imgIndex ? styles.active : ""}`}
                  onClick={() => setImgIndex(i)}>
                  <Image src={src} alt="" width={70} height={70} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.price}>{price}€</div>

          {Object.entries(variantGroups).map(([type, variants]) => (
            <div key={type}>
              <span className={styles.label}>{type}</span>
              <div className={styles.options}>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.active || (v.stock_quantity || 0) <= 0}
                    onClick={() => selectVariant(type, v.variant_value)}
                    className={`${styles.option} ${
                      selectedVariants[type] === v.variant_value ? styles.selected : ""
                    }`}>
                    {v.variant_value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className={styles.description}>{product.description}</p>
          <div className={styles.stockInfo}>
            <div
              className={`${styles.stockType} ${product.stock_type === "limited" ? styles.limited : styles.onDemand}`}>
              {product.stock_type === "limited" ? "Stock Limitado" : "Sob Encomenda"}
              {product.stock_type === "limited" && product.stock_quantity && (
                <span> - {product.stock_quantity} disponíveis</span>
              )}
            </div>

            <div className={styles.deliveryInfo}>
              {product.order_deadline && (
                <div className={styles.orderDeadline}>
                  Prazo de encomenda: {new Date(product.order_deadline).toLocaleDateString("pt-PT")}
                </div>
              )}

              {product.estimated_delivery && (
                <div className={styles.deliveryDate}>
                  {product.stock_type === "limited" ? "Entrega estimada: " : "Entrega estimada: "}
                  {new Date(product.estimated_delivery).toLocaleDateString("pt-PT")}
                </div>
              )}
            </div>
          </div>
          <div>
            <span className={styles.label}>Quantidade</span>
            <div className={styles.quantity}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>

          <button className={styles.addButton} onClick={addToCart} disabled={!allVariantsChosen}>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
      {related.length > 0 && (
        <div className={styles.relatedSection}>
          <h2 className={styles.relatedTitle}>Produtos Relacionados</h2>
          <div className={carouselStyles.container}>
            {showArrows && (
              <>
                <button
                  className={`${carouselStyles.arrow} ${carouselStyles.left}`}
                  onClick={() => swiperInstance?.slidePrev()}
                  aria-label="Anterior">
                  <IoIosArrowBack size={32} color="#222" />
                </button>
                <button
                  className={`${carouselStyles.arrow} ${carouselStyles.right}`}
                  onClick={() => swiperInstance?.slideNext()}
                  aria-label="Seguinte">
                  <IoIosArrowForward size={32} color="#222" />
                </button>
              </>
            )}
            <Swiper
              onSwiper={setSwiperInstance}
              modules={[Navigation, Autoplay]}
              navigation={false}
              autoplay={{ delay: 4000, disableOnInteraction: true }}
              loop={related.length > 3}
              speed={500}
              slidesPerView={3}
              spaceBetween={26}
              breakpoints={{
                1400: { slidesPerView: 4, spaceBetween: 30 },
                1024: { slidesPerView: 3 },
                640: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
              }}>
              {related.map((item) => (
                <SwiperSlide key={item.id}>
                  <ProductCard product={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}
