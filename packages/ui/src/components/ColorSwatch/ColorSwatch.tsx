import { ComponentPropsWithRef, Ref } from "react";
import styles from "./ColorSwatch.module.css";
import { cn } from "../../utils/cn";

export interface ColorSwatchProps extends Omit<ComponentPropsWithRef<"button">, "ref"> {
  color: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  ref?: Ref<HTMLButtonElement | HTMLSpanElement>;
}

export function ColorSwatch({
  color,
  active,
  size = "md",
  onClick,
  className,
  style,
  ariaLabel,
  title,
  ref,
  ...props
}: ColorSwatchProps) {
  const classes = cn(styles.swatch, styles[size], active && styles.active, className);
  const mergedStyle = { ...style, backgroundColor: color };
  const label = ariaLabel || color;

  if (!onClick)
    return (
      <span
        ref={ref as Ref<HTMLSpanElement>}
        role="img"
        aria-label={label}
        title={title}
        className={classes}
        style={mergedStyle}
      />
    );

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      className={classes}
      style={mergedStyle}
      onClick={onClick}
      aria-label={label}
      title={title}
      {...props}
    />
  );
}
