import React from "react";
import styles from "@/styles/pages/DinnerPage.module.css";

interface InfoListItemProps {
  icon: string | React.ReactNode;
  label: string;
  value: string;
  url?: string;
}

export default function InfoListItem({ icon, label, value, url }: InfoListItemProps) {
  return (
    <li className={styles.infoItem}>
      <span className={styles.icon}>{icon}</span>
      <strong>{label}:</strong>{" "}
      <span className={styles.infoValue}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </li>
  );
}
