"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import aoc from '@/assets/events/aoc.jpg';
import esports from '@/assets/events/esports.jpg';
import sweats from '@/assets/events/sweats.jpg';
import layout from '@/assets/events/layout.jpg';
import churrasco from '@/assets/events/churras.jpg';
import jantar from '@/assets/events/jantar_curso.jpg';
import letstalk from '@/assets/events/ltal.jpg';
import qtsm from '@/assets/events/qtsm.jpg';
import python from '@/assets/events/python.jpg';
import assembly from '@/assets/events/assembly.jpg';
import c from '@/assets/events/C.jpg';
import hashcode from '@/assets/events/hashcode.jpg';
import lip from '@/assets/events/lip.jpg';
import "swiper/css";
import "swiper/css/navigation";
import styles from "@/styles/components/homepage/Activities.module.css";

const events = [
  { title: "Advent of Code", image: aoc, description: "O Advent Of Code é um evento que lança desafios diários de programação, desde o dia 1 de dezembro até ao Natal. Estes desafios podem ser resolvidos na linguagem de programação que preferires! Quem obtiver mais pontos no final do evento, ganha!" },
  { title: "Torneio de E-Sports", image: esports, description: "Gostas de jogar? Que coincidência, este evento foi mesmo feito a pensar em ti! Reúne uma equipa e vem passar o dia connosco a jogar, comer e beber... e quem sabe ganhar um prémio ou outro!" },
  { title: "Sweats EIC", image: sweats, description: "E o que achas de teres uma sweat com o nome do teu curso? Não te esqueças, o NEIIST dá-te a oportunidade de teres a sweat do melhor curso!" },
  { title: "Concurso de Layout de Sweats", image: layout, description: "O Concurso de Layout de Sweats é a tua oportunidade de criar o layout oficial para a edição especial de cada ano. Se és estudante de EIC do IST podes submeter até 3 designs originais. Se ganhares a votação online, ganhas a sweat!" },
  { title: "Churrasco EIC", image: churrasco, description: "Mesmo que fosse uma semana de projetos ou exames, haveria sempre tempo para um convívio com amigos!" },
  { title: "Jantar de Curso", image: jantar, description: "Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!  A cerveja já está a tua espera…" },
  { title: "Let's Talk about LEIC", image: letstalk, description: "Acabaste de chegar ao curso e sentes-te perdido? Vem aprender connosco todos os truques para sobreviveres! Com este evento, junto dos alunos mais velhos, vais compreender como funciona LEIC e as suas disciplinas." },
  { title: "(Quase) Tudo Sobre MEIC", image: qtsm, description: "Vais entrar em MEIC? Se estás indeciso sobre quais áreas ou cadeiras escolher, vem assistir a estas sessões! Irão explicar-te tudo o que precisas saber sobre a estrutura do mestrado, o currículo, as diferentes áreas de especialização, a tese e muito mais." },
  { title: "Workshop de Python", image: python, description: "Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop onde vamos falar das principais bases da programação e ensinar-te os primeiros passos essenciais para o mundo informático!" },
  { title: "Workshop Assembly", image: assembly, description: "Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly que irão ser fundamentais em IAC!" },
  { title: "Workshop C", image: c, description: "Queres finalmente perceber o que é alocação de memória, o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!" },
  { title: "Hash Code", image: hashcode, description: "Junta-te a nós na competição de código desenvolvida pela Google na qual o NEIIST organiza uma Hub onde todos os alunos do técnico são bem-vindos a integrar e participar." },
  { title: "Linux Install Party", image: lip, description: "Vem instalar o Linux no teu PC, junto a alunos com experiência na área e na instalação dos vários flavors que o Linux tem para oferecer!" },
];

function Activities() {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const handleResize = () => {
      setShowArrows(!isTouch && window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="slider-container" style={{ position: "relative" }}>
      <h1 className={styles.title}>Atividades</h1>
      {showArrows && (
        <>
          <button
            className={styles.handle + " " + styles.leftHandle}
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => swiperInstance?.slidePrev()}
            aria-label="Previous"
          >
            <IoIosArrowBack size={40} color="#FFF"/>
          </button>
          <button
            className={styles.handle + " " + styles.rightHandle}
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => swiperInstance?.slideNext()}
            aria-label="Next"
          >
            <IoIosArrowForward size={40} color="#FFF" />
          </button>
        </>
      )}
      <Swiper
        onSwiper={setSwiperInstance}
        modules={[Navigation, Autoplay]}
        navigation={false}
        autoplay={{ delay: 3000, disableOnInteraction: true }}
        loop={true}
        speed={500}
        slidesPerView={4}
        spaceBetween={20}
        breakpoints={{
          1024: { slidesPerView: 3 },
          600: { slidesPerView: 2 },
          0: { slidesPerView: 1 },
        }}
        className={styles.slider}
      >
        {events.map((event, index) => (
          <SwiperSlide key={index}>
            <div className={styles.card}>
              <Image src={event.image} alt={event.title} className={styles.image} />
              <p className={styles.description}>{event.title}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Activities;
