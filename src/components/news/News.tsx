"use client";
import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";

import { Card } from "@neiist/ui";
import { CardItem } from "@/types/news";
import { Carousel } from "@/components/layout/Carousel";
import styles from "@/styles/components/news/News.module.css";

export default function News({ items }: { items: CardItem[] }) {
  const news = items;

  return (
    <div className={styles.carousel}>
      <Carousel
        autoplay={false}
        variant="news"
        items={news}
        getKey={(item) => item.id}
        slidesPerView={1}
        renderItem={(item) => (
          <Card className={styles.news}>
            <Card.Header title={item.title} description={item.description} />

            <Card.Body>
              <Image src={item.image} alt={item.title} className={styles.image} />
            </Card.Body>
          </Card>
        )}
      />
    </div>
  );
}
