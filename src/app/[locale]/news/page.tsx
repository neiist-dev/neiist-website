import { CardItem } from "@/types/news";
import News from "@/components/news/News";
import Partners from "@/components/news/Partners";
import aoc from "@/assets/events/aoc.jpg";
import sweats from "@/assets/events/sweats.jpg";
import styles from "@/styles/components/news/News.module.css";
import Image from "next/image";

import { Suspense } from "react";
import { connection } from "next/server";

async function DynamicMarker() {
  await connection();
  return null;
}

async function NewsContent() {
  const news: CardItem[] = [
    {
      id: "1",
      title: "Noticia A: Nova parceria em breve",
      description:
        "Descrição da Noticia A: Uma breve descrição da empresa, da sua missão e da sua área de atuação",
      image: <Image src={aoc} alt=""></Image>,
      link1: "linkA",
    },
    {
      id: "2",
      title: "Noticia B",
      description: "Descrição da Noticia B",
      image: <Image src={sweats} alt=""></Image>,
      link1: "linkB",
    },
    {
      id: "3",
      title: "Noticia C",
      description: "Descrição da Noticia C",
      image: <Image src={aoc} alt=""></Image>,
      link1: "linkC",
    },
  ];

  return <News items={news} />;
}

async function PartnersContent() {
  const partners: CardItem[] = [
    {
      id: "1",
      title: "Empresa A",
      description:
        "Descrição da Noticia A: Uma breve descrição da empresa, da sua missão e da sua área de atuação",
      addInfo: ["12% desconto com o código NEIIST", "2 meses gratis", "acesso antecipado"],
      image: <Image src={aoc} alt=""></Image>,
      link1: "linkA",
    },
    {
      id: "2",
      title: "Noticia B",
      description: "Descrição da Noticia B",
      addInfo: ["12% desconto com o código NEIIST", "2 meses gratis", "acesso antecipado"],
      image: <Image src={sweats} alt=""></Image>,
      link1: "linkB",
    },
    {
      id: "3",
      title: "Noticia C",
      description: "Descrição da Noticia C",
      image: <Image src={sweats} alt=""></Image>,
      link1: "linkC",
    },
    {
      id: "4",
      title: "Empresa D",
      description:
        "Descrição da Noticia A: Uma breve descrição da empresa, da sua missão e da sua área de atuação",
      addInfo: ["12% desconto com o código NEIIST", "2 meses gratis", "acesso antecipado"],
      image: <Image src={aoc} alt=""></Image>,
      link1: "linkA",
    },
    {
      id: "5",
      title: "Noticia E",
      description: "Descrição da Noticia B",
      image: <Image src={aoc} alt=""></Image>,
      link1: "linkB",
    },
    {
      id: "6",
      title: "Noticia F",
      description: "Descrição da Noticia C",
      addInfo: ["12% desconto com o código NEIIST", "2 meses gratis", "acesso antecipado"],
      image: <Image src={sweats} alt=""></Image>,
      link1: "linkC",
    },
  ];

  return <Partners items={partners} />;
}

export default function NewsPage() {
  return (
    <section>
      <NewsContent />
      <div className={styles.text}>
        <h1>Conhece os nossos parceiros</h1>
      </div>
      <section className={styles.partners}>
        <PartnersContent />
      </section>
      <Suspense>
        <DynamicMarker />
      </Suspense>
    </section>
  );
}
