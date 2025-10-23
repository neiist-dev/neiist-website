"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "swiper/css";
import "swiper/css/navigation";
import styles from "@/styles/components/homepage/Activities.module.css";
import { Event } from "@/types/events";

type ActivitiesProps = {
  events?: Event[];
  adminPreview?: boolean;
};

function Activities({ events: initialEvents = [], adminPreview = false }: ActivitiesProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
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

  useEffect(() => {
    if (adminPreview || initialEvents.length === 0) {
      fetch("/api/admin/events")
        .then((res) => res.json())
        .then((data) => setEvents(Array.isArray(data) ? data : (data?.event ?? [])))
        .catch(() => setEvents([]));
    }
  }, [adminPreview, initialEvents.length]);

  return (
    <div className={styles.activities}>
      <h1>Atividades</h1>
      <div className={styles.container}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>Sem atividades disponíveis.</div>
        ) : (
          <>
            {showArrows && (
              <>
                <button
                  className={`${styles.arrow} ${styles.left}`}
                  onClick={() => swiperInstance?.slidePrev()}
                  aria-label="Previous">
                  <IoIosArrowBack size={40} />
                </button>
                <button
                  className={`${styles.arrow} ${styles.right}`}
                  onClick={() => swiperInstance?.slideNext()}
                  aria-label="Next">
                  <IoIosArrowForward size={40} />
                </button>
              </>
            )}
            <div
              onMouseEnter={() => swiperInstance?.autoplay?.stop()}
              onMouseLeave={() => swiperInstance?.autoplay?.start()}>
              <Swiper
                onSwiper={setSwiperInstance}
                modules={[Navigation, Autoplay]}
                navigation={false}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                loop={events.length > 1}
                speed={500}
                slidesPerView={3}
                spaceBetween={20}
                breakpoints={{
                  1024: { slidesPerView: 3 },
                  600: { slidesPerView: 2 },
                  0: { slidesPerView: 1 },
                }}
                className={styles.slider}>
                {events.map((event, index) => (
                  <SwiperSlide key={event.id || index}>
                    <div className={styles.card}>
                      <Image
                        src={`/events/${event.image}`}
                        alt={event.title}
                        className={styles.image}
                        width={400}
                        height={250}
                      />
                      <div className={styles.label}>{event.title}</div>
                      <div className={styles.overlay}>
                        <h3 className={styles.eventTitle}>{event.title}</h3>
                        <p className={styles.description}>{event.description}</p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Activities;
