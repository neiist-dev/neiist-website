"use client";

import React, { useState } from "react";
import styles from "./TableFilter.module.css";
import { Calendar } from "../Calendar/Calendar";
import { Popover } from "../Popover/Popover";
import { Button } from "../Button/Button";
import type { Locale } from "date-fns";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface TableFilterDateProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: DateRange;
  onChange: (_range: DateRange) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  titleLabel: string;
  untilDateLabel: string;
  rangeLabel: string;
  clearLabel: string;
  applyLabel: string;
  drawerTitle: string;
  locale: Locale;
  showFooter?: boolean;
}

export function TableFilterDate({
  isOpen,
  onClose,
  dateRange,
  onChange,
  buttonRef,
  titleLabel,
  untilDateLabel,
  rangeLabel,
  clearLabel,
  applyLabel,
  drawerTitle,
  locale,
  showFooter = false,
}: TableFilterDateProps) {
  const [mode, setMode] = useState<"until" | "range">("until");

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={buttonRef}
      className={styles.dropdown}
      width="max-content"
      align="end"
      mobileDrawerPosition="right"
      mobileDrawerTitle={drawerTitle}>
      <header className={styles.header}>
        <h3 className={styles.title}>{titleLabel}</h3>
      </header>

      <div className={styles.tabs} role="group" aria-label={titleLabel}>
        <button
          type="button"
          className={mode === "until" ? styles.tabActive : styles.tab}
          aria-pressed={mode === "until"}
          onClick={() => {
            setMode("until");
            onChange({ start: null, end: dateRange.end });
          }}>
          {untilDateLabel}
        </button>
        <button
          type="button"
          className={mode === "range" ? styles.tabActive : styles.tab}
          aria-pressed={mode === "range"}
          onClick={() => setMode("range")}>
          {rangeLabel}
        </button>
      </div>

      <div className={styles.calendarWrapper}>
        {mode === "until" ? (
          <Calendar
            mode="single"
            locale={locale}
            selected={dateRange.end || undefined}
            onSelect={(date) => onChange({ start: null, end: date || null })}
          />
        ) : (
          <Calendar
            mode="range"
            locale={locale}
            selected={{ from: dateRange.start || undefined, to: dateRange.end || undefined }}
            onSelect={(range) => onChange({ start: range?.from || null, end: range?.to || null })}
          />
        )}
      </div>
      {showFooter && (
        <footer className={styles.footer}>
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            className={styles.footerBtn}
            onClick={() => onChange({ start: null, end: null })}>
            {clearLabel}
          </Button>
          <Button
            variant="solid"
            color="primary"
            size="sm"
            className={styles.footerBtn}
            onClick={onClose}>
            {applyLabel}
          </Button>
        </footer>
      )}
    </Popover>
  );
}
