import styles from "@/styles/components/dinner/FeatureCard.module.css";
import localFont from "next/font/local";
import type { ReactNode } from "react";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  className?: string;
};

export default function FeatureCard({ icon, title, onClick, className }: FeatureCardProps) {
  return (
    <button
      type="button"
      className={[styles.card, className].filter(Boolean).join(" ")}
      onClick={onClick}>
      <div className={styles.icon}>{icon}</div>
      <p className={[styles.cardTitle, handelsonTwo.className].join(" ")}>{title}</p>
    </button>
  );
}
