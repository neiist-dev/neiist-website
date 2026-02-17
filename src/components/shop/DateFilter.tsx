"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/shop/ColumnFilter.module.css";

interface DateFilterProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: Date | null; end: Date | null };
  onChange: (_range: { start: Date | null; end: Date | null }) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const leadingBlanks = (firstWeekday + 6) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    days.push(null);
  }
  for (let day = 1; day <= lastDate; day++) {
    days.push(new Date(year, month, day));
  }
  return days;
}

function isSameDay(firstDate: Date, secondDate: Date): boolean {
  return firstDate.toDateString() === secondDate.toDateString();
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function calculatePosition(button: HTMLButtonElement): { top: number; left: number } {
  const rect = button.getBoundingClientRect();
  const dropdownWidth = 320;
  const spacing = 8;
  const left = Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 16);
  return {
    top: rect.bottom + spacing,
    left: Math.max(16, left),
  };
}

export default function DateFilter({
  isOpen,
  onClose,
  dateRange,
  onChange,
  buttonRef,
}: DateFilterProps) {
  const [mode, setMode] = useState<"until" | "range">("until");
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside =
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target);

      if (isOutside) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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

  const handleDateSelect = (date: Date) => {
    if (mode === "until") {
      onChange({ start: null, end: date });
      return;
    }

    const { start, end } = dateRange;

    if (!start || (start && end)) {
      onChange({ start: date, end: null });
    } else if (start && !end) {
      if (date < start) {
        onChange({ start: date, end: start });
      } else {
        onChange({ start, end: date });
      }
    }
  };

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  if (!isOpen) return null;

  const days = getMonthDays(currentMonth);

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
        <h3 className={styles.title}>Data</h3>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === "until" ? styles.tabActive : styles.tab}
          onClick={() => setMode("until")}>
          Até data
        </button>
        <button
          type="button"
          className={mode === "range" ? styles.tabActive : styles.tab}
          onClick={() => setMode("range")}>
          Intervalo
        </button>
      </div>

      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          <button type="button" className={styles.navBtn} onClick={() => navigateMonth(-1)}>
            ‹
          </button>
          <div className={styles.monthLabel}>
            {currentMonth.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </div>
          <button type="button" className={styles.navBtn} onClick={() => navigateMonth(1)}>
            ›
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
            <div key={i} className={styles.dayName}>
              {day}
            </div>
          ))}

          {days.map((date, i) => {
            if (!date) {
              return <button key={i} type="button" className={styles.day} disabled />;
            }

            const { start, end } = dateRange;
            const isSelected = (start && isSameDay(date, start)) || (end && isSameDay(date, end));
            const isInRange = start && end && isDateInRange(date, start, end);

            return (
              <button
                key={i}
                type="button"
                className={`${styles.day} ${
                  isSelected ? styles.selected : ""
                } ${isInRange ? styles.inRange : ""}`}
                onClick={() => handleDateSelect(date)}>
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
