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

  const mainOption = optionNames[0] || "";
  const subOption = optionNames[1] || "";

  const mainValues = useMemo(() => {
    const set = new Set<string>();
    product.variants.forEach((v) => {
      if (v.options?.[mainOption]) {
        const cleanValue = v.options[mainOption].replace(/['"\\]/g, "");
        set.add(cleanValue);
      }
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

  const normalize = (val?: string) => (val ? val.replace(/['"\\]/g, "").trim() : "");

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

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => router.push("/shop")}>
        <IoIosArrowBack size={18} /> Voltar
      </button>
      <div className={styles.grid}>
        <div className={styles.imageSection}>
          {allImages.length > 1 && (
            <button
              className={styles.imageArrowLeft}
              onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}>
              <IoIosArrowBack size={26} />
            </button>
          )}
          <Image
            src={allImages[imgIndex]}
            alt={product.name}
            width={600}
            height={600}
            className={styles.mainImage}
          />
          {allImages.length > 1 && (
            <button
              className={styles.imageArrowRight}
              onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}>
              <IoIosArrowForward size={26} />
            </button>
          )}
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((src, i) => (
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
          <p className={styles.description}>{product.description}</p>
          <div className={styles.price}>{price.toFixed(2)}€</div>
          {mainOption && (
            <div>
              <span className={styles.label}>{mainOption}</span>
              <div
                className={
                  mainOption.toLowerCase() === "cor" ? styles.colorOptions : styles.options
                }>
                {mainValues.map((val) => (
                  <button
                    key={val}
                    className={`${styles.option} ${selectedMain === val ? styles.selected : ""}`}
                    style={
                      mainOption.toLowerCase() === "cor" ? { backgroundColor: val } : undefined
                    }
                    onClick={() => handleMainChange(val)}>
                    {mainOption.toLowerCase() === "cor" ? "" : val}
                  </button>
                ))}
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
                        const mainValue = v.options?.[mainOption]?.replace(/['"\\]/g, "");
                        const subValue = v.options?.[subOption]?.replace(/['"\\]/g, "");
                        return (
                          mainValue === selectedMain &&
                          subValue === val &&
                          v.active &&
                          (product.stock_type === "on_demand" || (v.stock_quantity ?? 0) > 0)
                        );
                      })
                    }>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          <button
            className={styles.addButton}
            onClick={addToCart}
            disabled={
              !selectedVariant ||
              !selectedVariant.active ||
              (product.stock_type === "limited" && (selectedVariant.stock_quantity ?? 0) <= 0)
            }>
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
