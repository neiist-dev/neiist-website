"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { cn } from "@neiist/ui";
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

interface HeroProps {
  dict: Dictionary["hero"];
  terminalDict: Dictionary["terminal"];
  locale: Locale;
}

export default function Hero({ dict, terminalDict, locale }: HeroProps) {
  const [studentMovementPosition, setStudentMovementPosition] = useState(50);
  const [isStudentFlipped, setIsStudentFlipped] = useState(false);
  const campusRef = useRef<HTMLElement>(null);
  const studentRef = useRef<HTMLImageElement>(null);
  const [showStudent, setShowStudent] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!campusRef.current || !studentRef.current) return;
      const campusWidth = campusRef.current.offsetWidth;
      const studentWidth = studentRef.current.offsetWidth;

      const marginPercent = 5;
      const minPercent = 0 - marginPercent;
      const maxPercent = ((campusWidth - studentWidth) / campusWidth) * 100 + marginPercent;

      if (event.key === "ArrowLeft") {
        setStudentMovementPosition((prev) => (prev - 1 < minPercent ? maxPercent : prev - 1));
        setIsStudentFlipped(true);
      } else if (event.key === "ArrowRight") {
        setStudentMovementPosition((prev) => (prev + 1 > maxPercent ? minPercent : prev + 1));
        setIsStudentFlipped(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className={styles.hero}>
      <header className={styles.header}>
        {dict.welcome_prefix && <p className={styles.welcome}>{dict.welcome_prefix}</p>}
        <h1 className={styles.title}>
          {dict.title_prefix}
          <ColorfulText as="span" text={dict.title_highlight} />
          {dict.title_suffix}
        </h1>
      </header>

      <aside className={styles.terminalSection} aria-label="Terminal">
        <HeroTerminal locale={locale} dict={terminalDict} />
      </aside>

      <figure ref={campusRef} className={styles.campusFigure}>
        <div className={styles.campusArt}>
          <Image src={hero} alt={dict.campus_alt} className={styles.campusImage} preload />

          {showStudent && (
            <Image
              ref={studentRef}
              src={student}
              alt={dict.student_alt}
              className={cn(styles.student, isStudentFlipped && styles.flipped)}
              style={{ left: `${studentMovementPosition}%` }}
              preload
            />
          )}
        </div>
      </figure>
    </section>
  );
}
