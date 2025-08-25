"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "swiper/css";
import "swiper/css/navigation";
import styles from "@/styles/components/shop/ShopProductList.module.css";
import { Product, Order, Category } from "@/types/shop";
import ProductCard from "@/components/shop/ProductCard";
import { getFeaturedAndTopProducts } from "@/utils/shopUtils";

export default function ShopProductList({
  products,
  orders,
  categories,
}: {
  products: Product[];
  orders: Order[];
  categories: Category[];
}) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [showArrows, setShowArrows] = useState(false);

  const { top } = getFeaturedAndTopProducts(products, orders);

  const filtered = products.filter(
    (p) =>
      (category === "all" ||
        p.category === categories.find((c) => c.id.toString() === category)?.name ||
        p.category === category) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const handleResize = () => setShowArrows(!isTouch && window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className={styles.categoryTabsHeader}>
        <button
          onClick={() => setCategory("all")}
          className={`${styles.tabButton} ${category === "all" ? styles.activeTab : ""}`}>
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.name)}
            className={`${styles.tabButton} ${category === cat.name ? styles.activeTab : ""}`}>
            {cat.name}
          </button>
        ))}
      </div>

      <section>
        <h2 className={styles.subTitle}>Mais Vendidos</h2>
        <div className={styles.container}>
          {showArrows && (
            <>
              <button
                className={`${styles.arrow} ${styles.left}`}
                onClick={() => swiperInstance?.slidePrev()}
                aria-label="Anterior">
                <IoIosArrowBack size={38} color="#222" />
              </button>
              <button
                className={`${styles.arrow} ${styles.right}`}
                onClick={() => swiperInstance?.slideNext()}
                aria-label="Seguinte">
                <IoIosArrowForward size={38} color="#222" />
              </button>
            </>
          )}
          <Swiper
            onSwiper={setSwiperInstance}
            modules={[Navigation, Autoplay]}
            navigation={false}
            autoplay={{ delay: 4000, disableOnInteraction: true }}
            loop={top.length > 2}
            speed={500}
            slidesPerView={4}
            spaceBetween={24}
            breakpoints={{
              1024: { slidesPerView: 3 },
              640: { slidesPerView: 2 },
              0: { slidesPerView: 1 },
            }}>
            {top.map((product) => (
              <SwiperSlide key={product.id} className={styles.slide}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <div className={styles.filtersRow}>
        <input
          className={styles.search}
          type="text"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
