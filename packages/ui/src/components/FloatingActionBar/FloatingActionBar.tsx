import React from "react";
import { cn } from "../../utils/cn";
import styles from "./FloatingActionBar.module.css";

export interface FloatingActionBarProps extends Omit<
  React.ComponentPropsWithRef<"aside">,
  "children"
> {
  countText: React.ReactNode;
  action: React.ReactNode;
}

export function FloatingActionBar({
  countText,
  action,
  className,
  ref,
  ...props
}: FloatingActionBarProps) {
  return (
    <aside
      ref={ref}
      role="toolbar"
      aria-label="Floating action bar"
      className={cn(styles.floatingPill, className)}
      {...props}>
      <span className={styles.pillCount}>{countText}</span>
      {action}
    </aside>
  );
}
