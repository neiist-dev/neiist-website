"use client";

import "swiper/css";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

import styles from "./Carousel.module.css";

interface CarouselProps<T> {
  items: T[];
  getKey: (_item: T) => string;
  renderItem: (_item: T) => React.ReactNode;
  slidesPerView?: number;
  breakpoints?: Record<number, { slidesPerView: number }>;
  showArrows?: boolean;
  autoplay?: boolean;
  variant?: "default" | "events" | "news" | "partners";
}

export function Carousel<T>({
  variant = "default",
  items,
  getKey,
  renderItem,
  slidesPerView = 3,
  breakpoints,
}: CarouselProps<T>) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const handleResize = () => {
      setShowArrows(!isTouch);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      {showArrows && (
        <>
          <button
            className={`${styles.arrow} ${styles.left}`}
            onClick={() => swiper?.slidePrev()}
            aria-label="Anterior">
            <IoIosArrowBack size={40} />
          </button>

          <button
            className={`${styles.arrow} ${styles.right}`}
            onClick={() => swiper?.slideNext()}
            aria-label="Próximo">
            <IoIosArrowForward size={40} />
          </button>
        </>
      )}

      <div
        onMouseEnter={() => swiper?.autoplay?.stop()}
        onMouseLeave={() => swiper?.autoplay?.start()}>
        <Swiper
          onSwiper={setSwiper}
          modules={[Navigation, Autoplay]}
          navigation={false}
          autoplay={{ delay: 1500, disableOnInteraction: false }}
          loop={items.length > 1}
          speed={500}
          slidesPerView={slidesPerView}
          spaceBetween={20}
          breakpoints={breakpoints}
          className={styles.slider}>
          {items.map((item) => (
            <SwiperSlide key={getKey(item)}>{renderItem(item)}</SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
