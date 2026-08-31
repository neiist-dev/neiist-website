"use client";
import styles from "@/styles/components/dinner/DinnerSurprises.module.css";
import Image from "next/image";
import penguinImg from "@/assets/events/DinnerPenguin.png";
import localFont from "next/font/local";
import FeatureCard from "@/components/dinner/FeatureCard";
import Link from "next/link";
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
import { useEffect, useRef, useState, useMemo, type TouchEvent } from "react";
import { Squash } from "hamburger-react";
import type { Dictionary } from "@/i18n/dictionaries";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

interface UnlockedDinnerPageProps {
  dict: Dictionary["dinner"]["surprises"];
  basePath: string;
}

export default function UnlockedDinnerPage({ dict, basePath }: UnlockedDinnerPageProps) {
  const cardData = useMemo(
    () => ({
      cartas: {
        title: dict.cartas.title,
        icon: <FaEnvelope />,
        className: styles.blueIcon,
        text: dict.cartas.text,
        description: dict.cartas.description,
      },
      votacoes: {
        title: dict.votacoes.title,
        icon: <FaVoteYea />,
        className: styles.redIcon,
        text: dict.votacoes.text,
        description: dict.votacoes.description,
      },
      story: {
        title: dict.story.title,
        icon: <FaCamera />,
        className: styles.yellowIcon,
        text: dict.story.text,
        description: dict.story.description,
      },
      posters: {
        title: dict.posters.title,
        icon: <FaBug />,
        className: styles.blueIcon,
        text: dict.posters.text,
        description: dict.posters.description,
      },
      tux: {
        title: dict.tux.title,
        icon: <FaLinux />,
        className: styles.redIcon,
        text: dict.tux.text,
        description: dict.tux.description,
      },
      stickers: {
        title: dict.stickers.title,
        icon: <FaTag />,
        className: styles.yellowIcon,
        text: dict.stickers.text,
        description: dict.stickers.description,
      },
      outfit: {
        title: dict.outfit.title,
        icon: <FaTshirt />,
        className: styles.blueIcon,
        text: dict.outfit.text,
        description: dict.outfit.description,
      },
      penaltis: {
        title: dict.futsal.title,
        icon: <FaFutbol />,
        className: styles.redIcon,
        text: dict.futsal.text,
        description: dict.futsal.description,
      },
      gym: {
        title: dict.flex.title,
        icon: <FaDumbbell />,
        className: styles.yellowIcon,
        text: dict.flex.text,
        description: dict.flex.description,
      },
      prizes: {
        title: dict.chambel.title,
        icon: <FaTrophy />,
        className: styles.blueIcon,
        text: dict.chambel.text,
        description: dict.chambel.description,
      },
      justdance: {
        title: dict.spotify.title,
        icon: <FaMusic />,
        className: styles.redIcon,
        text: dict.spotify.text,
        description: dict.spotify.description,
      },
      karaoke: {
        title: dict.karaoke.title,
        icon: <FaMicrophone />,
        className: styles.yellowIcon,
        text: dict.karaoke.text,
        description: dict.karaoke.description,
      },
    }),
    [dict]
  );

  type CardKey = keyof typeof cardData;

  const [selectedCard, setSelectedCard] = useState<CardKey | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);

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
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    touchCurrentYRef.current = touchStartYRef.current;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    touchCurrentYRef.current = event.touches[0]?.clientY ?? touchCurrentYRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null || touchCurrentYRef.current === null) return;

    const swipeDistance = touchCurrentYRef.current - touchStartYRef.current;
    touchStartYRef.current = null;
    touchCurrentYRef.current = null;

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
            {dict.welcome_message}
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
                <button className={styles.close} onClick={closeCard} aria-label={dict.close_label}>
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

                {selectedCard === "votacoes" && (
                  <div className={styles.votingButtonWrapper}>
                    <Link
                      href={`${basePath}/dinner/vote`}
                      className={`${styles.votingButton} ${handelsonTwo.className}`}>
                      {dict.voting_button}
                    </Link>
                  </div>
                )}
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
          <Image src={penguinImg} alt={dict.poster_alt} className={styles.unlockedImage} priority />
        </div>
      </div>
    </div>
  );
}
