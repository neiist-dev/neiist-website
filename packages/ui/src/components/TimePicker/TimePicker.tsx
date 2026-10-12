"use client";

import React, { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import { DrumWheel } from "./DrumWheel";
import styles from "./TimePicker.module.css";

export interface TimeRangeValue {
  start: string;
  end: string;
}

export type Pair = [number, number];
export const DAY = 1440;

export const pad = (n: number) => String(n).padStart(2, "0");

export const nowMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + Math.floor(now.getMinutes() / 5) * 5;
};

export function formatTime(minutes: number, fmt: "12h" | "24h" = "24h"): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = pad(minutes % 60);
  if (fmt === "12h") {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = pad(h % 12 || 12);
    return `${h12}:${m} ${period}`;
  }
  return `${pad(h)}:${m}`;
}

export function parseTime(text?: string, fallback = 0): number {
  if (!text?.trim()) return fallback;
  const match = text.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return fallback;
  let h = Number(match[1]);
  const m = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return (h % 24) * 60 + (m % 60);
}

export function parsePair(val: string | TimeRangeValue | undefined, fallback: Pair): Pair {
  if (!val) return fallback;
  const [s, e] = typeof val === "string" ? val.split(/[–-]/) : [val.start, val.end];
  return [parseTime(s, fallback[0]), parseTime(e, fallback[1])];
}

export interface BaseTimePickerProps {
  format?: "12h" | "24h";
  minuteStep?: number;
  className?: string;
}

export type SingleTimePickerProps = BaseTimePickerProps & {
  range?: false;
  value?: string;
  onChange?: (_time: string) => void;
};

export type RangeTimePickerProps = BaseTimePickerProps & {
  range: true;
  value?: TimeRangeValue;
  onChange?: (_timeRange: TimeRangeValue) => void;
};

export type TimePickerProps = SingleTimePickerProps | RangeTimePickerProps;

const HOURS = {
  "12h": Array.from({ length: 12 }, (_, i) => pad(i + 1)),
  "24h": Array.from({ length: 24 }, (_, i) => pad(i)),
};
const PERIODS = ["AM", "PM"];

export function TimePicker(props: TimePickerProps) {
  const { format: fmt = "24h", minuteStep = 5, className } = props;
  const [part, setPart] = useState<0 | 1>(0);
  const [draft, setDraft] = useState<Pair>(() => {
    const now = nowMinutes();
    return [now, (now + 120) % DAY];
  });

  const step = Math.max(1, Math.min(30, minuteStep));
  const minutes = useMemo(() => {
    const list: string[] = [];
    for (let m = 0; m < 60; m += step) list.push(pad(m));
    return list;
  }, [step]);

  const times = parsePair(props.value, draft);
  const t = times[part];
  const h24 = Math.floor(t / 60);
  const m = (Math.round((t % 60) / step) * step) % 60;
  const is12 = fmt === "12h";
  const pm = t >= DAY / 2;

  const commit = (value: number) => {
    const next: Pair = part ? [times[0], value] : [value, times[1]];
    const [start, end] = next.map((x) => formatTime(x, fmt));
    setDraft(next);
    if (props.range) {
      (props.onChange as ((_timeRange: TimeRangeValue) => void) | undefined)?.({
        start,
        end,
      });
    } else {
      (props.onChange as ((_time: string) => void) | undefined)?.(start);
    }
  };

  const setHour = (h: string) => commit((is12 ? (+h % 12) + (pm ? 12 : 0) : +h) * 60 + m);
  const setMinute = (v: string) => commit(h24 * 60 + +v);
  const setPeriod = (p: string) => commit((t % 720) + (p === "PM" ? 720 : 0));

  return (
    <div className={cn(styles.container, className)}>
      {props.range && (
        <div className={styles.rangeHeader} role="group" aria-label="Time range">
          {times.map((x, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className={styles.rangeArrow}>→</span>}
              <button
                type="button"
                className={cn(styles.rangeButton, part === i && styles.rangeButtonActive)}
                onClick={() => setPart(i as 0 | 1)}
                title={i ? "Adjust end time" : "Adjust start time"}>
                {formatTime(x, fmt)}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className={styles.wheelBelt}>
        <div className={styles.selectionHighlight} />
        <div className={styles.vignetteTop} />
        <div className={styles.vignetteBottom} />
        <DrumWheel
          label="Hours"
          items={HOURS[fmt]}
          value={pad(is12 ? h24 % 12 || 12 : h24)}
          onChange={setHour}
        />
        <div className={styles.colonSeparator}>:</div>
        <DrumWheel label="Minutes" items={minutes} value={pad(m)} onChange={setMinute} />
        {is12 && (
          <DrumWheel
            label="Period"
            items={PERIODS}
            value={pm ? "PM" : "AM"}
            onChange={setPeriod}
            loop={false}
          />
        )}
      </div>
    </div>
  );
}
