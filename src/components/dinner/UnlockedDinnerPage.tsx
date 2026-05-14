"use client";
import styles from "@/styles/components/dinner/DinnerSurprises.module.css";
import Image from "next/image";
import penguinImg from "@/assets/events/DinnerPenguin.png";
import localFont from "next/font/local";
import FeatureCard from "@/components/dinner/FeatureCard";
import {
  FaCamera,
  FaDumbbell,
  FaEnvelope,
  FaBug,
  FaFutbol,
  FaLinux,
  FaMicrophone,
  FaMusic,
  FaTag,
  FaTrophy,
  FaTshirt,
  FaVoteYea,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { Squash } from "hamburger-react";
import type { TouchEvent } from "react";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

const cardData = {
  cartas: {
    title: "Cartas",
    icon: <FaEnvelope />,
    className: styles.blueIcon,
    text: "Encontra a tua carta-par!",
    description:
      "Durante o check-in, cada pessoa recebe uma carta.\n Encontra quem tem a carta correspondente e dirige-te ao staff para receberem ambos uma senha para bebida.",
    when: "Check-in do jantar",
    reward: "1 senha por pessoa",
  },
  votações: {
    title: "Votações",
    icon: <FaVoteYea />,
    className: styles.redIcon,
    text: "Vota nos títulos mais icónicos!",
    description:
      "Durante o jantar vais poder votar em categorias especiais como “Vibe Coder”, “Crypto Bro”, “Fantasma” e muitas mais.\n Os vencedores recebem faixas especiais no final da noite.",
    when: "Check-in do jantar",
    reward: "Faixas",
  },
  story: {
    title: "Story NEIIST",
    icon: <FaCamera />,
    className: styles.yellowIcon,
    text: "Publica uma story e ganha bebida!",
    description:
      "Publica uma foto ou vídeo do jantar no Instagram, identifica o @neiist e mantém a story durante pelo menos 1 hora. Depois mostra ao staff para receberes a tua senha.",
    when: "Durante o jantar",
    reward: "1 senha",
  },
  posters: {
    title: "Bug nos Posters",
    icon: <FaBug />,
    className: styles.blueIcon,
    text: "Consegues encontrar os bugs?",
    description:
      "Existem posters espalhados pelo jantar — alguns têm bugs escondidos. Descobre os posters com erro e mostra ao staff para receberes uma senha.",
    when: "Durante o jantar",
    reward: "1 senha por poster",
  },
  tux: {
    title: "Encontra o Tux",
    icon: <FaLinux />,
    className: styles.redIcon,
    text: "Onde está o Tux?",
    description:
      "Vai existir um cartaz gigante com um Tux escondido. As primeiras pessoas a encontrá-lo recebem uma senha. Tira foto e mostra ao staff.",
    when: "Durante o jantar",
    reward: "1 senha",
  },
  stickers: {
    title: "Stickers NEIIST",
    icon: <FaTag />,
    className: styles.yellowIcon,
    text: "Procura os stickers escondidos!",
    description:
      "Existem stickers NEIIST escondidos pelo espaço. Se encontrares um, entrega-o ao staff e recebe uma senha.",
    when: "Durante o jantar",
    reward: "1 senha",
  },
  outfit: {
    title: "Outfit Embaraçoso",
    icon: <FaTshirt />,
    className: styles.blueIcon,
    text: "Usa um outfit cursed",
    description:
      "Usa uma das t-shirts ou acessórios embaraçosos disponíveis durante o jantar e recebe uma senha pela coragem.",
    when: "Durante o jantar",
    reward: "1 senha",
  },
  penaltis: {
    title: "Penáltis",
    icon: <FaFutbol />,
    className: styles.redIcon,
    text: "Mostra os teus skills!",
    description:
      "Participa no concurso de penáltis depois do jantar. Os melhores recebem prémios especiais.",
    when: "Depois do jantar",
    reward: "Chapéus de cerveja",
  },
  gym: {
    title: "Prancha & Flexões",
    icon: <FaDumbbell />,
    className: styles.yellowIcon,
    text: "Aguentas mais que os outros?",
    description:
      "Concurso de resistência física com prancha e flexões. Última pessoa a desistir ganha.",
    when: "Depois do jantar",
    reward: "Mini gym kit + mini estátua",
  },
  prizes: {
    title: "Entrega de Prémios",
    icon: <FaTrophy />,
    className: styles.blueIcon,
    text: "Os títulos vão ser revelados!",
    description:
      "No final da noite serão anunciados os vencedores das categorias especiais votadas durante o jantar.",
    when: "Depois do jantar",
    reward: "TBD",
  },
  justdance: {
    title: "Just Dance",
    icon: <FaMusic />,
    className: styles.redIcon,
    text: "Dance battle time",
    description:
      "Participa no torneio de Just Dance e impressiona a Chola. O vencedor recebe senhas especiais.",
    when: "Final da noite",
    reward: "5 senhas",
  },
  karaoke: {
    title: "Karaoke",
    icon: <FaMicrophone />,
    className: styles.yellowIcon,
    text: "Canta sozinho ou com amigos!",
    description:
      "Durante uma hora o palco vai estar aberto para karaoke. Participa e recebe uma senha.",
    when: "Final da noite",
    reward: "1 senha",
  },
} as const;

type CardKey = keyof typeof cardData;

export default function UnlockedDinnerPage() {
  const [selectedCard, setSelectedCard] = useState<CardKey | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const closeCard = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setIsClosing(true);
      closeTimeoutRef.current = window.setTimeout(() => {
        setSelectedCard(null);
        setIsClosing(false);
        closeTimeoutRef.current = null;
      }, 300);
      return;
    }

    setSelectedCard(null);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
    touchCurrentY.current = touchStartY.current;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    touchCurrentY.current = event.touches[0]?.clientY ?? touchCurrentY.current;
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchCurrentY.current === null) return;

    const swipeDistance = touchCurrentY.current - touchStartY.current;
    touchStartY.current = null;
    touchCurrentY.current = null;

    if (typeof window !== "undefined" && window.innerWidth <= 768 && swipeDistance > 80)
      closeCard();
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.unlockedLeftColumn}>
          <h1 className={`${styles.mainTitle} ${handelsonTwo.className}`}>
            <span className={styles.topLine}>
              <span className={styles.jantar}>JANTAR</span>
              <span className={styles.de}>de</span>
            </span>
            <span className={styles.curso}>CURSO</span>
          </h1>

          <p className={`${styles.WelcomeMessage} ${handelsonTwo.className}`}>
            Bem-vindo ao jantar de curso!
            <br />
            Explora todas as atividades que preparámos para ti:
          </p>

          {selectedCard && (
            <div className={styles.overlayContainer} onClick={closeCard}>
              <div
                className={[styles.sideModal, isClosing ? styles.sideModalClosing : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(event) => event.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}>
                <button className={styles.close} onClick={closeCard} aria-label="Fechar">
                  <Squash toggled={true} toggle={closeCard} size={20} color="currentColor" />
                </button>

                <div className={styles.modalHandle} />

                <div
                  className={[styles.modalIcon, cardData[selectedCard].className]
                    .filter(Boolean)
                    .join(" ")}>
                  {cardData[selectedCard].icon}
                </div>

                <h2 className={[styles.modalTitle, handelsonTwo.className].join(" ")}>
                  {cardData[selectedCard].title}
                </h2>

                <div className={styles.modalDivider} />

                <p
                  className={[
                    styles.modalText,
                    handelsonTwo.className,
                    cardData[selectedCard].className,
                  ]
                    .filter(Boolean)
                    .join(" ")}>
                  {cardData[selectedCard].text}
                </p>

                <p className={`${styles.modalDescription} ${handelsonTwo.className}`}>
                  {cardData[selectedCard].description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.unlockedRightColumn}>
          <div className={styles.unlockedGrid}>
            {Object.entries(cardData).map(([key, card]) => (
              <FeatureCard
                key={key}
                className={card.className}
                onClick={() => setSelectedCard(key as CardKey)}
                icon={card.icon}
                title={card.title}
              />
            ))}
          </div>
          <Image
            src={penguinImg}
            alt="Poster do Jantar de Curso"
            className={styles.unlockedImage}
            priority
          />
        </div>
      </div>
    </div>
  );
}
