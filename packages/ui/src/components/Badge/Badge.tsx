import React from "react";
import styles from "./Badge.module.css";
import { cn } from "../../utils/cn";

export interface BadgeProps extends React.ComponentPropsWithRef<"span"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "quaternary" | "outline" | "danger";
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: (_event: React.MouseEvent<HTMLButtonElement>) => void;
  removeAriaLabel?: string;
  className?: string;
}

export function Badge({
  children,
  variant = "primary",
  size = "md",
  removable,
  onRemove,
  removeAriaLabel = "Remove",
  className,
  ref,
  ...props
}: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(styles.badge, styles[variant], styles[size], className)}
      {...props}>
      {children}
      {removable && (
        <button
          type="button"
          aria-label={removeAriaLabel}
          className={styles.removeBtn}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.(event);
          }}>
          &times;
        </button>
      )}
    </span>
  );
}
