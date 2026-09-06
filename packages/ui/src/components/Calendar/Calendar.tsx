import React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import styles from "./Calendar.module.css";
import { cn } from "../../utils/cn";

export type { DateRange as CalendarDateRange } from "react-day-picker";

export type CalendarProps = DayPickerProps & {
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
};

export function Calendar({
  className,
  style,
  captionLayout = "dropdown",
  navLayout = "around",
  weekStartsOn = 1,
  ref,
  ...props
}: CalendarProps) {
  return (
    <div ref={ref} className={cn(styles.calendar, className)} style={style}>
      <DayPicker
        captionLayout={captionLayout}
        navLayout={navLayout}
        weekStartsOn={weekStartsOn}
        {...props}
      />
    </div>
  );
}
