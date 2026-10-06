"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiPlay } from "react-icons/fi";
import { Button, cn } from "@neiist/ui";
import hero from "@/assets/homepage/hero.png";
import student from "@/assets/homepage/student.png";
import styles from "@/styles/components/homepage/Hero.module.css";
import ColorfulText from "@/components/ColorfulText";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";

const HeroTerminal = dynamic(() => import("@/components/terminal/HeroTerminal"), {
  ssr: false,
  loading: () => <div className={styles.terminalPlaceholder} aria-hidden="true" />,
});

const CampusRunner = dynamic(() => import("@/components/game/CampusRunner"), { ssr: false });

interface HeroProps {
  dict: Dictionary["hero"];
  terminalDict: Dictionary["terminal"];
  gameDict: Dictionary["game"];
  locale: Locale;
  announcement?: React.ReactNode;
}

export default function Hero({ dict, terminalDict, gameDict, locale, announcement }: HeroProps) {
  const [showStudent, setShowStudent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const hasPlayedRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const campusRef = useRef<HTMLElement>(null);
  /** Document y of the campus before the game started, for the glide animation. */
  const campusStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const checkDesktop = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isDesktop = window.innerWidth >= 864;
      setShowStudent(!isTouch && isDesktop);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Return focus to the Play button after leaving the game
  useEffect(() => {
    if (isPlaying) hasPlayedRef.current = true;
    else if (hasPlayedRef.current) playButtonRef.current?.focus({ preventScroll: true });
  }, [isPlaying]);

  // Glide the campus into the centre (translate only, so the canvas measures its real size)
  useLayoutEffect(() => {
    const campus = campusRef.current;
    const startY = campusStartYRef.current;
    campusStartYRef.current = null;
    if (!isPlaying || !campus) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionRef.current?.scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "auto" : "smooth",
    });

    if (startY === null || reducedMotion) return;
    const delta = startY - (campus.getBoundingClientRect().top + window.scrollY);
    if (Math.abs(delta) < 1) return;
    campus.animate([{ translate: `0 ${delta}px` }, { translate: "0 0" }], {
      duration: 500,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }, [isPlaying]);

  const startGame = () => {
    const campus = campusRef.current;
    if (campus) campusStartYRef.current = campus.getBoundingClientRect().top + window.scrollY;
    setIsPlaying(true);
  };
  const exitGame = useCallback(() => setIsPlaying(false), []);

  const handleCampusClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isPlaying) return;
    const target = event.target as Element;
    // React bubbles events from portals (e.g. the announcement's modal) through this figure;
    // only clicks that physically land on the campus should start the game
    if (!event.currentTarget.contains(target)) return;
    // Clicks on the announcement (or any other link/button) keep their own behaviour
    if (target.closest(`a, button, input, label, .${styles.announcementSlot}`)) return;
    startGame();
  };

  return (
    <section ref={sectionRef} className={cn(styles.hero, isPlaying && styles.playing)}>
      <header className={cn(styles.header, isPlaying && styles.hidden)}>
        {dict.welcome_prefix && <p className={styles.welcome}>{dict.welcome_prefix}</p>}
        <h1 className={styles.title}>
          {dict.title_prefix}
          <ColorfulText as="span" text={dict.title_highlight} />
          {dict.title_suffix}
        </h1>
      </header>

      {/* Kept mounted while playing so the terminal session survives a round of the game */}
      <aside
        className={cn(styles.terminalSection, isPlaying && styles.hidden)}
        aria-label="Terminal">
        <HeroTerminal locale={locale} dict={terminalDict} />
      </aside>

      <figure ref={campusRef} className={styles.campus} onClick={handleCampusClick}>
        {isPlaying ? (
          <CampusRunner dict={gameDict} onExit={exitGame} />
        ) : (
          <>
            <Image src={hero} alt={dict.campus_alt} className={styles.campusImage} preload />

            {announcement && <div className={styles.announcementSlot}>{announcement}</div>}

            {showStudent && (
              <Image src={student} alt={dict.student_alt} className={styles.student} preload />
            )}

            <div className={styles.playSlot}>
              <Button
                ref={playButtonRef}
                variant="solid"
                color="primary"
                size="sm"
                shape="pill"
                onClick={startGame}
                aria-label={gameDict.play_label}>
                <FiPlay aria-hidden="true" /> {gameDict.play}
              </Button>
            </div>
          </>
        )}
      </figure>
    </section>
  );
}
