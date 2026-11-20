"use client";

import { CardItem } from "@/types/news";
import { Carousel } from "@neiist/ui";
import styles from "@/styles/components/news/News.module.css";

export default function News({ items }: { items: CardItem[] }) {
  return (
    <Carousel className={styles.slider} slidesPerView={1} autoplay={5000} loop>
      {items?.map((currentItem) => (
        <Carousel.FeatureCard
          className={styles.news}
          key={currentItem.id}
          title={currentItem.title}
          description={currentItem.description}
          image={currentItem.image}
          imagePosition="right"
        />
      ))}
    </Carousel>
  );
}
