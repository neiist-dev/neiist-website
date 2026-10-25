"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { FiPlay } from "react-icons/fi";
import { Button, cn } from "@neiist/ui";
import hero from "@/assets/homepage/hero.png";
import student from "@/assets/homepage/student.png";
import ColorfulText from "@/components/ColorfulText";
import HeroTerminal from "@/components/terminal/HeroTerminal";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/i18n-config";
import styles from "@/styles/components/homepage/Hero.module.css";

const CampusRunner = dynamic(() => import("@/components/game/CampusRunner"), { ssr: false });

interface HeroProps {
  dict: Dictionary["hero"];
  terminalDict: Dictionary["terminal"];
  gameDict: Dictionary["game"];
  locale: Locale;
  announcement?: React.ReactNode;
}

export default function Hero({ dict, terminalDict, gameDict, locale, announcement }: HeroProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = useCallback(() => setIsPlaying(true), []);
  const exitGame = useCallback(() => setIsPlaying(false), []);

  return (
    <section className={cn(styles.hero, isPlaying && styles.playing)}>
      <header className={styles.header}>
        {dict.welcome_prefix && <p className={styles.welcome}>{dict.welcome_prefix}</p>}
        <h1 className={styles.title}>
          <span className={styles.titleLine}>
            {dict.title_prefix}
            <ColorfulText as="span" text={dict.title_highlight} />
          </span>
          <span className={styles.titleLine}>{dict.title_suffix.trim()}</span>
        </h1>
      </header>

      <aside className={styles.terminalSection} aria-label="Terminal">
        <HeroTerminal locale={locale} dict={terminalDict} onStartGame={startGame} />
      </aside>

      <figure className={styles.campus}>
        {isPlaying ? (
          <CampusRunner dict={gameDict} onExit={exitGame} />
        ) : (
          <>
            <Image
              src={hero}
              alt={dict.campus_alt}
              className={styles.campusImage}
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />

            {announcement && <div className={styles.announcementSlot}>{announcement}</div>}

            <div className={styles.studentSlot}>
              <Button
                variant="solid"
                color="primary"
                size="sm"
                shape="pill"
                onClick={startGame}
                aria-label={gameDict.play_label}>
                <FiPlay aria-hidden="true" /> {gameDict.play}
              </Button>
              <Image
                src={student}
                alt={dict.student_alt}
                className={styles.student}
                loading="lazy"
              />
            </div>
          </>
        )}
      </figure>
    </section>
  );
}
