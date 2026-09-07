"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "../Calendar/Calendar";
import { Popover } from "../Popover/Popover";
import { format, parse, isValid } from "date-fns";
import type { Locale } from "date-fns";
import { FaRegCalendarAlt } from "react-icons/fa";
import { cn } from "../../utils/cn";
import styles from "./DateInput.module.css";

export interface DateInputProps {
  value?: Date;
  onChange?: (_date?: Date) => void;
  placeholder?: string;
  mobileDrawerTitle: string;
  locale: Locale;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
  inline?: boolean;
}

export function DateInput({
  value,
  onChange,
  placeholder = "",
  mobileDrawerTitle,
  locale,
  dateFormat = "dd/MM/yyyy",
  className,
  disabled,
  inline = false,
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() =>
    value && isValid(value) ? format(value, dateFormat) : ""
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, dateFormat));
    } else {
      setInputValue("");
    }
  }, [value, dateFormat]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setInputValue(val);

    if (val.length === 10) {
      const parsedDate = parse(val, dateFormat, new Date());
      if (isValid(parsedDate)) {
        if (onChange) onChange(parsedDate);
      }
    } else if (val === "") {
      if (onChange) onChange(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setInputValue(format(date, dateFormat));
      if (onChange) onChange(date);
      if (!inline) setIsOpen(false);
    } else {
      setInputValue("");
      if (onChange) onChange(undefined);
    }
  };

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      <div
        className={styles.wrapper}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}>
        <input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
        />
        <FaRegCalendarAlt size={16} className={styles.icon} />
      </div>

      {inline ? (
        <div className={styles.inlineCalendar}>
          <Calendar mode="single" selected={value} onSelect={handleDateSelect} locale={locale} />
        </div>
      ) : (
        <Popover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          anchorRef={containerRef}
          width="max-content"
          mobileDrawerPosition="bottom"
          mobileDrawerTitle={mobileDrawerTitle}>
          <div className={styles.popoverCalendarWrapper}>
            <Calendar mode="single" selected={value} onSelect={handleDateSelect} locale={locale} />
          </div>
        </Popover>
      )}
    </div>
  );
}
