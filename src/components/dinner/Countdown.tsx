"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/pages/DinnerPage.module.css";
import localFont from "next/font/local";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

type TimeLeft = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const targetDate = new Date("2026-05-21T20:00:00");

function getTimeLeft(): TimeLeft {
  const total = targetDate.getTime() - new Date().getTime();

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`${styles.countdown} ${handelsonTwo.className}`}>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{String(timeLeft.days).padStart(2, "0")}</span>
        <span className={styles.countdownLabel}>dias</span>
      </div>
      <span className={styles.countdownDot}>•</span>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className={styles.countdownLabel}>horas</span>
      </div>
      <span className={styles.countdownDot}>•</span>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className={styles.countdownLabel}>minutos</span>
      </div>
      <span className={styles.countdownDot}>•</span>
      <div className={styles.countdownItem}>
        <span className={styles.countdownValue}>{String(timeLeft.seconds).padStart(2, "0")}</span>
        <span className={styles.countdownLabel}>segundos</span>
      </div>
    </div>
  );
}
