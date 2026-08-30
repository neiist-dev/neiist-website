"use client";

import Image from "next/image";
import hero from "@/assets/homepage/hero.png";
import student from "@/assets/homepage/student.png";
import styles from "@/styles/components/homepage/Hero.module.css";
import { useEffect, useState, useRef } from "react";
import { Dictionary } from "@/i18n/dictionaries";
import ColorfulText from "@/components/ColorfulText";

export default function Hero({ dict }: { dict: Dictionary["hero"] }) {
  const [studentMovementPosition, setStudentMovementPosition] = useState(50);
  const [isStudentFlipped, setIsStudentFlipped] = useState(false);
  const campusRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLImageElement>(null);
  const [showStudent, setShowStudent] = useState(false);

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const handleResize = () => {
      setShowStudent(!isTouch);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        setStudentMovementPosition((prev) => {
          if (prev - 1 < minPercent) return maxPercent;
          return prev - 1;
        });
        setIsStudentFlipped(true);
      } else if (event.key === "ArrowRight") {
        setStudentMovementPosition((prev) => {
          if (prev + 1 > maxPercent) return minPercent;
          return prev + 1;
        });
        setIsStudentFlipped(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        {dict.title_prefix}
        <ColorfulText as="span" text={dict.title_highlight} />
        {dict.title_suffix}
      </h1>
      <div ref={campusRef} className={styles.heroImage}>
        <Image src={hero} alt={dict.campus_alt} className={styles.campusImage} preload />
        {showStudent && (
          <Image
            ref={studentRef}
            src={student}
            alt={dict.student_alt}
            className={styles.student + (isStudentFlipped ? " " + styles.flipped : "")}
            style={{ left: `${studentMovementPosition}%` }}
            preload
          />
        )}
      </div>
    </section>
  );
}
