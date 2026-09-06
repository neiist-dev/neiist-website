import React from "react";
import styles from "./Text.module.css";
import { cn } from "../../utils/cn";

export interface TextProps extends React.ComponentPropsWithRef<"p"> {
  size?: "sm" | "md" | "lg";
  variant?: "muted" | "default";
}

export function Text({
  size = "md",
  variant = "default",
  children,
  className,
  ref,
  ...props
}: TextProps) {
  return (
    <p ref={ref} className={cn(styles.text, styles[size], styles[variant], className)} {...props}>
      {children}
    </p>
  );
}
