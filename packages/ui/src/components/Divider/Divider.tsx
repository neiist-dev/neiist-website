import React from "react";
import styles from "./Divider.module.css";
import { cn } from "../../utils/cn";

export interface DividerProps extends React.ComponentPropsWithRef<"div"> {
  orientation?: "horizontal" | "vertical";
  label?: React.ReactNode;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ref,
  ...props
}: DividerProps) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        styles.divider,
        styles[orientation],
        Boolean(label) && styles.hasLabel,
        className
      )}
      {...props}>
      {label && orientation === "horizontal" && <span className={styles.label}>{label}</span>}
    </div>
  );
}
