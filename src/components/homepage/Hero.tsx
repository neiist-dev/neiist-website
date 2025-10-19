"use client";

import Image from "next/image";
import campusIST from "@/assets/homepage/CampusIST.png";
import student from "@/assets/homepage/Student.png";
import styles from "@/styles/components/homepage/Hero.module.css";
import { useEffect, useState, useRef } from "react";

export default function Hero() {
  const [studentMovementPosition, setStudentMovementPosition] = useState(50);
  const [isStudentFlipped, setStudentFlipped] = useState(false);
  const campusRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLImageElement>(null);

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
          if (prev - 1 < minPercent) return minPercent;
          return prev - 1;
        });
        setStudentFlipped(true);
      } else if (event.key === "ArrowRight") {
        setStudentMovementPosition((prev) => {
          if (prev + 1 > maxPercent) return maxPercent;
          return prev + 1;
        });
        setStudentFlipped(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>
        Núcleo Estudantil de
        <span className={styles.primary}> In</span>
        <span className={styles.secondary}>for</span>
        <span className={styles.tertiary}>mát</span>
        <span className={styles.quaternary}>ica </span>
        do Instituto Superior Técnico
      </h1>
      <div ref={campusRef} className={styles.campusImage}>
        <Image src={campusIST} alt="IST Campus" fill style={{ objectFit: "cover" }} />
        <Image
          ref={studentRef}
          src={student}
          alt="Student"
          className={styles.student + (isStudentFlipped ? " " + styles.flipped : "")}
          style={{ left: `${studentMovementPosition}%` }}
          priority
        />
      </div>
    </section>
  );
}
