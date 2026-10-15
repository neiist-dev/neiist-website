"use client";

import React, { useState, useRef, useEffect } from "react";
import { Popover } from "../Popover/Popover";
import {
  TimePicker,
  TimeRangeValue,
  parseTime,
  parsePair,
  formatTime,
  nowMinutes,
  DAY,
} from "../TimePicker/TimePicker";
import { FaRegClock } from "react-icons/fa";
import { cn } from "../../utils/cn";
import styles from "./HourInput.module.css";

export type { TimeRangeValue } from "../TimePicker/TimePicker";

export interface BaseHourInputProps {
  format?: "12h" | "24h";
  placeholder?: string;
  mobileDrawerTitle?: string;
  className?: string;
  disabled?: boolean;
  minuteStep?: number;
  inline?: boolean;
}

export type SingleHourInputProps = BaseHourInputProps & {
  range?: false;
  value?: string;
  onChange?: (_time: string) => void;
};

export type RangeHourInputProps = BaseHourInputProps & {
  range: true;
  value?: TimeRangeValue;
  onChange?: (_timeRange: TimeRangeValue) => void;
};

export type HourInputProps = SingleHourInputProps | RangeHourInputProps;

export function HourInput(props: HourInputProps) {
  const {
    value,
    onChange,
    range = false,
    format: formatType = "24h",
    placeholder,
    mobileDrawerTitle = "Select time",
    className,
    disabled,
    minuteStep = 5,
    inline = false,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const emit = onChange as ((_val: string | TimeRangeValue) => void) | undefined;
  const emptyValue = range ? { start: "", end: "" } : "";

  const displayInputValue =
    typeof value === "string" ? value : value?.start ? `${value.start} – ${value.end}` : "";

  const [inputRawValue, setInputRawValue] = useState(displayInputValue);

  useEffect(() => {
    setInputRawValue(displayInputValue);
  }, [displayInputValue]);

  const commitInputRawValue = () => {
    const trimmed = inputRawValue.trim();
    if (!trimmed) {
      setInputRawValue("");
      emit?.(emptyValue);
      return;
    }

    if (range) {
      const now = nowMinutes();
      const [startMin, endMin] = parsePair(trimmed, [now, (now + 120) % DAY]);
      const formattedRange: TimeRangeValue = {
        start: formatTime(startMin, formatType),
        end: formatTime(endMin, formatType),
      };
      setInputRawValue(`${formattedRange.start} – ${formattedRange.end}`);
      emit?.(formattedRange);
    } else {
      const m = parseTime(trimmed, nowMinutes());
      const formatted = formatTime(m, formatType);
      setInputRawValue(formatted);
      emit?.(formatted);
    }
  };

  const defaultPlaceholder = range ? "HH:MM – HH:MM" : formatType === "12h" ? "hh:mm AM" : "HH:mm";

  const showPicker = inline || isOpen;
  const pickerElement = showPicker ? (
    range ? (
      <TimePicker
        range
        value={value as TimeRangeValue}
        onChange={emit}
        format={formatType}
        minuteStep={minuteStep}
      />
    ) : (
      <TimePicker
        value={value as string}
        onChange={emit}
        format={formatType}
        minuteStep={minuteStep}
      />
    )
  ) : null;

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      <div
        className={styles.wrapper}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}>
        <input
          value={inputRawValue}
          onChange={(event) => {
            const nextVal = event.target.value;
            setInputRawValue(nextVal);
            if (!nextVal.trim()) {
              emit?.(emptyValue);
            }
          }}
          onBlur={commitInputRawValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitInputRawValue();
            }
          }}
          placeholder={placeholder || defaultPlaceholder}
          disabled={disabled}
          className={styles.input}
        />
        <FaRegClock size={16} className={styles.icon} />
      </div>

      {inline ? (
        <div className={styles.inlinePicker}>{pickerElement}</div>
      ) : (
        <Popover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          anchorRef={containerRef}
          width="max-content"
          mobileDrawerTitle={mobileDrawerTitle}>
          <div className={styles.popoverPickerWrapper}>{pickerElement}</div>
        </Popover>
      )}
    </div>
  );
}
