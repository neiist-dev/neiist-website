"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/shop/ColumnFilter.module.css";
import { FiCheck } from "react-icons/fi";

interface MultiSelectFilterProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  selected: string[];
  onChange: (_selected: string[]) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  getLabel?: (_option: string) => string;
}

function calculatePosition(button: HTMLButtonElement): { top: number; left: number } {
  const rect = button.getBoundingClientRect();
  const dropdownWidth = 280;
  const spacing = 8;
  const left = Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 16);
  return {
    top: rect.bottom + spacing,
    left: Math.max(16, left),
  };
}

export default function MultiSelectFilter({
  isOpen,
  onClose,
  options,
  selected,
  onChange,
  buttonRef,
  title,
  getLabel,
}: MultiSelectFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (buttonRef.current) {
        setPosition(calculatePosition(buttonRef.current));
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutside =
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target);

      if (isOutside) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, buttonRef, onClose]);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={styles.dropdown}
      style={
        position
          ? {
              position: "absolute",
              top: `${position.top}px`,
              left: `${position.left}px`,
            }
          : undefined
      }>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.list}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <div key={option} className={styles.listItem} onClick={() => toggleOption(option)}>
              <div className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}>
                {isSelected && <FiCheck size={14} />}
              </div>
              <span className={styles.label}>{getLabel ? getLabel(option) : option}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
