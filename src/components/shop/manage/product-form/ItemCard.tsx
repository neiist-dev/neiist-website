"use client";

import { type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa";
import styles from "@/styles/components/shop/manage/ProductForm.module.css";

interface ItemCardProps {
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  onActiveToggle?: () => void;
  title: string;
  subtitle?: string | null;
  hex?: string;
  typeTag?: string | null;
  meta?: string | null;
  badge?: number;
  children: ReactNode;
}

export function ItemCard({
  isOpen,
  onToggle,
  isActive = true,
  onActiveToggle,
  title,
  subtitle,
  hex,
  typeTag,
  meta,
  badge = 0,
  children,
}: ItemCardProps) {
  return (
    <div className={`${styles.itemCard} ${!isActive ? styles.itemCardInactive : ""}`}>
      <div className={styles.itemHeader} onClick={onToggle}>
        <div className={styles.itemHeaderLeft}>
          {onActiveToggle && (
            <input
              type="checkbox"
              checked={isActive}
              className={styles.checkbox}
              onClick={(e) => e.stopPropagation()}
              onChange={onActiveToggle}
            />
          )}
          {hex ? (
            <span className={styles.swatch} style={{ background: hex }} />
          ) : typeTag ? (
            <span className={styles.typeTag}>{typeTag}</span>
          ) : null}
          <span className={styles.itemTitle}>{title}</span>
          {subtitle && <span className={styles.itemSubtitle}>{subtitle}</span>}
        </div>
        <div className={styles.itemHeaderRight}>
          {meta && <span className={styles.itemMeta}>{meta}</span>}
          {badge > 0 && <span className={styles.badge}>{badge}</span>}
          <FaChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} />
        </div>
      </div>
      <div className={`${styles.itemBody} ${!isOpen ? styles.itemBodyClosed : ""}`}>{children}</div>
    </div>
  );
}
