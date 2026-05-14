import styles from "@/styles/pages/FeatureCard.module.css";
import { ReactNode } from "react";
import localFont from "next/font/local";

const handelsonTwo = localFont({
  src: "../../assets/fonts/handelson-two.otf",
  display: "swap",
});

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  fontClassName?: string;
  onClick?: () => void;
  className?: string;
};

export default function FeatureCard({ icon, title, subtitle, fontClassName, onClick, className,}: FeatureCardProps) {
  return (
    <div className={`${styles.card} ${className}`} onClick={onClick}>
      <div className={styles.icon}>{icon}</div>
      <p className={`${styles.cardTitle} ${handelsonTwo.className}`}>{title}</p>
      {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
    </div>
  );
}