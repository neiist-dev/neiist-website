import React from "react";
import styles from "./Progress.module.css";
import { cn } from "../../utils/cn";

export interface ProgressProps extends React.ComponentPropsWithRef<"progress"> {
  value: number;
  max?: number;
  showValue?: boolean;
}

export function Progress({
  value,
  max = 100,
  showValue = false,
  className,
  ref,
  ...props
}: ProgressProps) {
  const clampedMax = max > 0 ? max : 100;
  const clampedVal = Math.max(0, Math.min(value, clampedMax));
  const percentage = Math.round((clampedVal / clampedMax) * 100);

  if (showValue) {
    return (
      <div className={styles.wrapper}>
        <progress
          ref={ref}
          value={clampedVal}
          max={clampedMax}
          className={cn(styles.progress, className)}
          {...props}
        />
        <span className={styles.value}>{percentage}%</span>
      </div>
    );
  }

  return (
    <progress
      ref={ref}
      value={clampedVal}
      max={clampedMax}
      className={cn(styles.progress, className)}
      {...props}
    />
  );
}
