"use client";
import Image from "next/image";
import { useMemo } from "react";
import { SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import styles from "@/styles/components/homepage/Activities.module.css";
import { Event } from "@/types/events";
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
import { Carousel } from "@/components/layout/Carousel";

export default function Activities({ dict }: { dict: Dictionary["activities"] }) {
  const events: Event[] = useMemo(
    () => [
      {
        id: "1",
        title: dict.events.aoc.title,
        description: dict.events.aoc.description,
        image: aoc,
      },
      {
        id: "2",
        title: dict.events.esports.title,
        description: dict.events.esports.description,
        image: esports,
      },
      {
        id: "3",
        title: dict.events.sweats.title,
        description: dict.events.sweats.description,
        image: sweats,
      },
      {
        id: "4",
        title: dict.events.layout.title,
        description: dict.events.layout.description,
        image: layout,
      },
      {
        id: "5",
        title: dict.events.churras.title,
        description: dict.events.churras.description,
        image: churras,
      },
      {
        id: "6",
        title: dict.events.jantar_curso.title,
        description: dict.events.jantar_curso.description,
        image: jantar_curso,
      },
      {
        id: "7",
        title: dict.events.ltal.title,
        description: dict.events.ltal.description,
        image: ltal,
      },
      {
        id: "8",
        title: dict.events.qtsm.title,
        description: dict.events.qtsm.description,
        image: qtsm,
      },
      {
        id: "9",
        title: dict.events.python.title,
        description: dict.events.python.description,
        image: python,
      },
      {
        id: "10",
        title: dict.events.assembly.title,
        description: dict.events.assembly.description,
        image: assembly,
      },
      {
        id: "11",
        title: dict.events.c.title,
        description: dict.events.c.description,
        image: c,
      },
      {
        id: "12",
        title: dict.events.hashcode.title,
        description: dict.events.hashcode.description,
        image: hashcode,
      },
      {
        id: "13",
        title: dict.events.lip.title,
        description: dict.events.lip.description,
        image: lip,
      },
    ],
    [dict]
  );

  return (
    <div className={styles.activities}>
      <h1>{dict.title}</h1>

      <div className={styles.container}>
        {events.length === 0 ? (
          <div className={styles.noEvents}>{dict.no_events}</div>
        ) : (
          <>
            <Carousel
              variant="events"
              items={events}
              getKey={(event) => event.id}
              slidesPerView={3}
              breakpoints={{
                1024: { slidesPerView: 3 },
                600: { slidesPerView: 2 },
                0: { slidesPerView: 1 },
              }}
              renderItem={(event) => (
                <SwiperSlide key={event.id}>
                  <div className={styles.card}>
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
                      className={styles.image}
                    />

                    <div className={styles.label}>{event.title}</div>

                    <div className={styles.overlay}>
                      <h3 className={styles.eventTitle}>{event.title}</h3>
                      <p className={styles.description}>{event.description}</p>
                    </div>
                  </div>
                </SwiperSlide>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}
