import { ComponentPropsWithRef } from "react";
import styles from "./ColorSwatch.module.css";
import { cn } from "../../utils/cn";

export interface ColorSwatchProps extends ComponentPropsWithRef<"button"> {
  color: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function ColorSwatch({
  color,
  active,
  size = "md",
  onClick,
  className,
  ariaLabel,
  ref,
  ...props
}: ColorSwatchProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(styles.swatch, styles[size], active && styles.active, className)}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={ariaLabel || color}
      {...props}
    />
  );
}
