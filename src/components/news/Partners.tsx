"use client";
import Image from "next/image";
import { useState, useRef } from "react";

import { CardItem } from "@/types/news";
import { Card } from "@neiist/ui";
import styles from "@/styles/components/news/News.module.css";

export default function Partners({ items }: { items: CardItem[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTouchDevice = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const handleMouseEnter = (index: number, element: HTMLDivElement) => {
    if (isTouchDevice()) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    const currentHeight = element.offsetHeight;

    timerRef.current = setTimeout(() => {
      setLockedHeight(currentHeight);
      setExpandedIndex(index);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice()) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setExpandedIndex(null);
    setLockedHeight(null);
  };

  const handleClick = (index: number, element: HTMLDivElement) => {
    if (!isTouchDevice()) return;

    if (expandedIndex === index) {
      setExpandedIndex(null);
      setLockedHeight(null);
    } else {
      setLockedHeight(element.offsetHeight);
      setExpandedIndex(index);
    }
  };

  return (
    <>
      {items.map((partner, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <div
            key={partner.id}
            className={`${styles.cardWrapper} ${isExpanded ? styles.expanded : ""}`}
            style={
              !isExpanded && lockedHeight
                ? ({ "--locked-height": `${lockedHeight}px` } as React.CSSProperties)
                : undefined
            }
            onMouseEnter={(e) => handleMouseEnter(index, e.currentTarget)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => handleClick(index, e.currentTarget)}>
            <Card className={styles.card}>
              <Card.Body>
                <Image src={partner.image} alt={partner.title} />
              </Card.Body>

              <Card.Header title={partner.title} description={partner.description} />

              <div className={styles.extraInfo}>
                {partner.addInfo && partner.addInfo.length > 0 && (
                  <div>
                    <p>Mais detalhes sobre a parceria, website, contactos, etc.</p>
                    <ul>
                      {partner.addInfo.map((info) => (
                        <li key={info}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <a href={partner.link1} target="_blank" rel="noopener noreferrer">
                    Visitar Parceiro
                  </a>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </>
  );
}
