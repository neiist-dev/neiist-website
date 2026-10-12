"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

  const displayInputValue = range
    ? typeof value === "object" && value !== null && "start" in value
      ? `${value.start} – ${value.end}`
      : typeof value === "string"
        ? value
        : ""
    : typeof value === "string"
      ? value
      : "";

  const [inputRawValue, setInputRawValue] = useState(displayInputValue);

  useEffect(() => {
    setInputRawValue(displayInputValue);
  }, [displayInputValue]);

  const handleSingleTimeChange = useCallback(
    (newTime: string) => {
      setInputRawValue(newTime);
      (onChange as ((_time: string) => void) | undefined)?.(newTime);
    },
    [onChange]
  );

  const handleRangeTimeChange = useCallback(
    (newRange: TimeRangeValue) => {
      setInputRawValue(`${newRange.start} – ${newRange.end}`);
      (onChange as ((_timeRange: TimeRangeValue) => void) | undefined)?.(newRange);
    },
    [onChange]
  );

  const commitInputRawValue = useCallback(() => {
    const trimmed = inputRawValue.trim();
    if (!trimmed) {
      setInputRawValue("");
      if (range) {
        (onChange as ((_timeRange: TimeRangeValue) => void) | undefined)?.({
          start: "",
          end: "",
        });
      } else {
        (onChange as ((_time: string) => void) | undefined)?.("");
      }
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
      (onChange as ((_timeRange: TimeRangeValue) => void) | undefined)?.(formattedRange);
    } else {
      const m = parseTime(trimmed, nowMinutes());
      const formatted = formatTime(m, formatType);
      setInputRawValue(formatted);
      (onChange as ((_time: string) => void) | undefined)?.(formatted);
    }
  }, [range, inputRawValue, formatType, onChange]);

  const defaultPlaceholder = range ? "HH:MM – HH:MM" : formatType === "12h" ? "hh:mm AM" : "HH:mm";

  const showPicker = inline || isOpen;
  const pickerElement = showPicker ? (
    range ? (
      <TimePicker
        range
        value={value as TimeRangeValue}
        onChange={handleRangeTimeChange}
        format={formatType}
        minuteStep={minuteStep}
      />
    ) : (
      <TimePicker
        value={value as string}
        onChange={handleSingleTimeChange}
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
              if (range) {
                (onChange as ((_timeRange: TimeRangeValue) => void) | undefined)?.({
                  start: "",
                  end: "",
                });
              } else {
                (onChange as ((_time: string) => void) | undefined)?.("");
              }
            }
          }}
          onBlur={commitInputRawValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitInputRawValue();
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
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
          mobileDrawerPosition="bottom"
          mobileDrawerTitle={mobileDrawerTitle}>
          <div className={styles.popoverPickerWrapper}>{pickerElement}</div>
        </Popover>
      )}
    </div>
  );
}
