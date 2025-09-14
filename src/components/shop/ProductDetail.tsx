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
import { Product, CartItem } from "@/types/shop";
import styles from "@/styles/components/shop/ProductDetail.module.css";
import carouselStyles from "@/styles/components/shop/ShopProductList.module.css";

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
}

export default function ProductDetail({ product, allProducts }: ProductDetailProps) {
  const router = useRouter();
  const optionNames = useMemo(() => {
    const all = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.options || {}).forEach((k) => all.add(k)));
    return Array.from(all);
  }, [product.variants]);

  const mainOption = optionNames[0] || "Cor";
  const subOption = optionNames[1] || "Tamanho";
  const mainValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.options?.[mainOption]) set.add(v.options[mainOption]);
    });
    return Array.from(set);
  }, [product.variants, mainOption]);

  const [selectedMain, setSelectedMain] = useState(mainValues[0] || "");
  const subValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.options?.[mainOption] === selectedMain && v.options?.[subOption]) {
        set.add(v.options[subOption]);
      }
    });
    return Array.from(set);
  }, [product.variants, mainOption, subOption, selectedMain]);

  const [selectedSub, setSelectedSub] = useState(subValues[0] || "");
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const selectedVariant = useMemo(() => {
    return product.variants.find(
      (v) => v.options?.[mainOption] === selectedMain && v.options?.[subOption] === selectedSub
    );
  }, [product.variants, mainOption, subOption, selectedMain, selectedSub]);

  const images = useMemo(() => {
    const v = product.variants.find(
      (v) => v.options?.[mainOption] === selectedMain && v.images?.length
    );
    return v?.images?.length
      ? v.images
      : product.images.length
        ? product.images
        : ["/placeholder.jpg"];
  }, [product, selectedMain, mainOption]);

  const price = useMemo(() => {
    return (product.price || 0) + (selectedVariant?.price_modifier || 0);
  }, [product.price, selectedVariant]);

  const related = useMemo(
    () =>
      allProducts.filter(
        (currentProduct) =>
          currentProduct.id !== product.id && currentProduct.category === product.category
      ),
    [allProducts, product]
  );
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const showArrows = related.length > 3;

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
    const newSub = product.variants.find((v) => v.options?.[mainOption] === val)?.options?.[
      subOption
    ];
    setSelectedSub(newSub || "");
    setImgIndex(0);
  };

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
            src={images[imgIndex]}
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
          <div className={styles.price}>{price.toFixed(2)}€</div>
          <div>
            <span className={styles.label}>{mainOption}</span>
            <div className={styles.options}>
              {mainValues.map((val) => (
                <button
                  key={val}
                  className={`${styles.option} ${selectedMain === val ? styles.selected : ""}`}
                  onClick={() => handleMainChange(val)}>
                  {val}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={styles.label}>{subOption}</span>
            <div className={styles.options}>
              {subValues.map((val) => (
                <button
                  key={val}
                  className={`${styles.option} ${selectedSub === val ? styles.selected : ""}`}
                  onClick={() => setSelectedSub(val)}
                  disabled={
                    !product.variants.some(
                      (v) =>
                        v.options?.[mainOption] === selectedMain &&
                        v.options?.[subOption] === val &&
                        v.active &&
                        (product.stock_type === "on_demand" || (v.stock_quantity ?? 0) > 0)
                    )
                  }>
                  {val}
                </button>
              ))}
            </div>
          </div>
          <p className={styles.description}>{product.description}</p>
          <div className={styles.stockInfo}>
            <div
              className={`${styles.stockType} ${
                product.stock_type === "limited" ? styles.limited : styles.onDemand
              }`}>
              {product.stock_type === "limited" ? "Stock Limitado" : "Sob Encomenda"}
              {product.stock_type === "limited" && selectedVariant?.stock_quantity != null && (
                <span> - {selectedVariant.stock_quantity} disponíveis</span>
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
                  Entrega estimada:{" "}
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
          <button className={styles.addButton} onClick={addToCart} disabled={!selectedVariant}>
            Adicionar ao Carrinho
          </button>
          {selectedVariant && selectedVariant.label && (
            <div className={styles.label} style={{ marginTop: ".5rem" }}>
              Variante: {selectedVariant.label}
            </div>
          )}
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
