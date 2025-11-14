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

const Events: Event[] = [
  {
    id: "1",
    title: "Advent of Code",
    description:
      "O Advent Of Code é um evento que lança desafios diários de programação, desde o dia 1 de dezembro até ao Natal. Estes desafios podem ser resolvidos na linguagem de programação que preferires! Quem obtiver mais pontos no final do evento, ganha!",
    image: aoc,
  },
  {
    id: "2",
    title: "Torneio de E-Sports",
    description:
      "Gostas de jogar? Que coincidência, este evento foi mesmo feito a pensar em ti! Reúne uma equipa e vem passar o dia connosco a jogar, comer e beber... e quem sabe ganhar um prémio ou outro!",
    image: esports,
  },
  {
    id: "3",
    title: "Sweats EIC",
    description:
      "E o que achas de teres uma sweat com o nome do teu curso? Não te esqueças, o NEIIST dá-te a oportunidade de teres a sweat do melhor curso!",
    image: sweats,
  },
  {
    id: "4",
    title: "Concurso de Layout de Sweats",
    description:
      "O Concurso de Layout de Sweats é a tua oportunidade de criar o layout oficial para a edição especial de cada ano. Se és estudante de EIC do IST podes submeter até 3 designs originais. Se ganhares a votação online, ganhas a sweat!",
    image: layout,
  },
  {
    id: "5",
    title: "Churrasco EIC",
    description:
      "Mesmo que fosse uma semana de projetos ou exames, haveria sempre tempo para um convívio com amigos!",
    image: churras,
  },
  {
    id: "6",
    title: "Jantar de Curso",
    description:
      "Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!  A cerveja já está a tua espera…",
    image: jantar_curso,
  },
  {
    id: "7",
    title: "Let's Talk about LEIC",
    description:
      "Acabaste de chegar ao curso e sentes-te perdido? Vem aprender connosco todos os truques para sobreviveres! Com este evento, junto dos alunos mais velhos, vais compreender como funciona LEIC e as suas disciplinas.",
    image: ltal,
  },
  {
    id: "8",
    title: "(Quase) Tudo Sobre MEIC",
    description:
      "Vais entrar em MEIC? Se estás indeciso sobre quais áreas ou cadeiras escolher, vem assistir a estas sessões! Irão explicar-te tudo o que precisas saber sobre a estrutura do mestrado, o currículo, as diferentes áreas de especialização, a tese e muito mais.",
    image: qtsm,
  },
  {
    id: "9",
    title: "Workshop de Python",
    description:
      "Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop onde vamos falar das principais bases da programação e ensinar-te os primeiros passos essenciais para o mundo informático!",
    image: python,
  },
  {
    id: "10",
    title: "Workshop Assembly",
    description:
      "Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly que irão ser fundamentais em IAC!",
    image: assembly,
  },
  {
    id: "11",
    title: "Workshop C",
    description:
      "Queres finalmente perceber o que é alocação de memória, o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!",
    image: c,
  },
  {
    id: "12",
    title: "Hash Code",
    description:
      "Junta-te a nós na competição de código desenvolvida pela Google na qual o NEIIST organiza uma Hub onde todos os alunos do técnico são bem-vindos a integrar e participar.",
    image: hashcode,
  },
  {
    id: "13",
    title: "Linux Install Party",
    description:
      "Vem instalar o Linux no teu PC, junto a alunos com experiência na área e na instalação dos vários flavors que o Linux tem para oferecer!",
    image: lip,
  },
];

function Activities() {
  const [events] = useState<Event[]>(Events);
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
                autoplay={{ delay: 1500, disableOnInteraction: false }}
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
                        src={event.image}
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
