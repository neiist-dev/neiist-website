"use client";

import Image from "next/image";
import hero from "@/assets/homepage/hero.png";
import student from "@/assets/homepage/student.png";
import styles from "@/styles/components/homepage/Hero.module.css";
import { useEffect, useState, useRef } from "react";

const NEIIST_ROOMS = {
  left: "Sala 1.10",
  right: "Sala 1.11",
};

export default function Hero() {
  const [studentMovementPosition, setStudentMovementPosition] = useState(50);
  const [isStudentFlipped, setStudentFlipped] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const campusRef = useRef<HTMLDivElement>(null);
  const studentRef = useRef<HTMLImageElement>(null);
  const [showStudent, setStudent] = useState(false);
  const [showRoom, setShowRoom] = useState<string | null>(null);

  // Campus door position interaction ranges
  const leftDoorMin = 10;
  const leftDoorMax = 20;
  const rightDoorMin = 75;
  const rightDoorMax = 85;
  const isAtLeftDoor =
    studentMovementPosition >= leftDoorMin && studentMovementPosition <= leftDoorMax;
  const isAtRightDoor =
    studentMovementPosition >= rightDoorMin && studentMovementPosition <= rightDoorMax;

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const handleResize = () => {
      setStudent(!isTouch);
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

      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        setStudentMovementPosition((prev) => {
          if (prev - 1 < minPercent) return maxPercent;
          return prev - 1;
        });
        setStudentFlipped(true);
      } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        setStudentMovementPosition((prev) => {
          if (prev + 1 > maxPercent) return minPercent;
          return prev + 1;
        });
        setStudentFlipped(false);
      } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        if (!isJumping) {
          setIsJumping(true);
          setTimeout(() => setIsJumping(false), 400);
        }
      } else if (event.key === "e" || event.key === "E") {
        if (isAtLeftDoor) {
          setShowRoom(NEIIST_ROOMS.left);
          setTimeout(() => setShowRoom(null), 2000);
        } else if (isAtRightDoor) {
          setShowRoom(NEIIST_ROOMS.right);
          setTimeout(() => setShowRoom(null), 2000);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isJumping, studentMovementPosition]);

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
      <div ref={campusRef} className={styles.heroImage}>
        <Image src={hero} alt="IST Campus" className={styles.campusImage} />
        {showStudent && (
          <Image
            ref={studentRef}
            src={student}
            alt="Student"
            className={
              styles.student +
              (isStudentFlipped ? " " + styles.flipped : "") +
              (isJumping ? " " + styles.jumping : "")
            }
            style={{ left: `${studentMovementPosition}%` }}
            preload
          />
        )}
        {(isAtLeftDoor || isAtRightDoor) && !showRoom && (
          <div
            className={styles.interactPrompt}
            style={
              isAtLeftDoor
                ? { left: "15%", bottom: "18%", transform: "none" }
                : isAtRightDoor
                  ? { left: "82%", bottom: "18%", transform: "none" }
                  : { left: "50%", bottom: "18%", transform: "translateX(-50%)" }
            }>
            <span>
              <b className={styles.interactKey}>E</b>
              <span className={styles.interactText}> para interagir</span>
            </span>
          </div>
        )}
        {showRoom && (
          <div
            className={styles.roomPrompt}
            style={
              showRoom === NEIIST_ROOMS.left
                ? { left: "15%", bottom: "24%", transform: "none" }
                : { left: "82%", bottom: "24%", transform: "none" }
            }>
            <span className={styles.roomNumber}>{showRoom}</span>
            <span className={styles.roomSubtitle}>
              {showRoom === NEIIST_ROOMS.left
                ? "Sala do Campus Alameda"
                : "Sala do Campus Taguspark"}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
