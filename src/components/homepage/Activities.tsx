import Image, { type StaticImageData } from "next/image";
import { Carousel, OverlayCard } from "@neiist/ui";
import { Dictionary } from "@/i18n/dictionaries";
import aoc from "@/assets/events/aoc.jpg";
import esports from "@/assets/events/esports.jpg";
import sweats from "@/assets/events/sweats.jpg";
import layout from "@/assets/events/layout.jpg";
import churras from "@/assets/events/churras.jpg";
import jantar_curso from "@/assets/events/jantar_curso.jpg";
import ltal from "@/assets/events/ltal.jpg";
import qtsm from "@/assets/events/qtsm.jpg";
import python from "@/assets/events/python.jpg";
import c from "@/assets/events/C.jpg";
import assembly from "@/assets/events/assembly.jpg";
import hashcode from "@/assets/events/hashcode.jpg";
import lip from "@/assets/events/lip.jpg";
import styles from "@/styles/components/homepage/Activities.module.css";

const EVENTS: ReadonlyArray<{
  key: keyof Dictionary["activities"]["events"];
  image: StaticImageData;
}> = [
  { key: "aoc", image: aoc },
  { key: "esports", image: esports },
  { key: "sweats", image: sweats },
  { key: "layout", image: layout },
  { key: "churras", image: churras },
  { key: "jantar_curso", image: jantar_curso },
  { key: "ltal", image: ltal },
  { key: "qtsm", image: qtsm },
  { key: "python", image: python },
  { key: "assembly", image: assembly },
  { key: "c", image: c },
  { key: "hashcode", image: hashcode },
  { key: "lip", image: lip },
];

export default function Activities({ dict }: { dict: Dictionary["activities"] }) {
  return (
    <section className={styles.activities}>
      <h1>{dict.title}</h1>
      <Carousel
        slidesPerView={3}
        autoplay={4000}
        loop
        prevLabel={dict.prev_label}
        nextLabel={dict.next_label}>
        {EVENTS.map(({ key, image }) => {
          const { title, description } = dict.events[key];
          return (
            <OverlayCard
              key={key}
              title={title}
              description={description}
              image={
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              }
            />
          );
        })}
      </Carousel>
    </section>
  );
}
