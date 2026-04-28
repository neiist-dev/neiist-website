import React from "react";
import styles from "@/styles/pages/DinnerPage.module.css";

interface InfoListItemProps {
  icon: string | React.ReactNode;
  label: string;
  value: string;
}

export default function InfoListItem({ icon, label, value }: InfoListItemProps) {
  return (
    <li className={styles.infoItem}>
      <span className={styles.icon}>{icon}</span>
      <strong>{label}:</strong> <span className={styles.infoValue}>{value}</span>
    </li>
  );
}