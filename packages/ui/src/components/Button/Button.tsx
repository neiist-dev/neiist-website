import { ComponentPropsWithRef } from "react";
import styles from "./Button.module.css";
import { cn } from "../../utils/cn";
import { Spinner } from "../Spinner/Spinner";

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonColor = "primary" | "secondary" | "neutral" | "danger" | "success" | "warning";

export type ButtonVariantOrColor = ButtonVariant | ButtonColor;

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariantOrColor;
  color?: ButtonColor;
  size?: "sm" | "md" | "lg" | "icon";
  shape?: "default" | "pill";
  loading?: boolean;
  fullWidth?: boolean;
}

const isColor = (val: string): val is ButtonColor =>
  ["primary", "secondary", "neutral", "danger", "success", "warning"].includes(val);

export function Button({
  children,
  variant = "solid",
  color,
  size = "md",
  shape = "default",
  loading,
  fullWidth,
  className,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  let resolvedVariant: ButtonVariant = "solid";
  let resolvedColor: ButtonColor = color || "primary";

  if (isColor(variant)) {
    resolvedColor = color || variant;
    resolvedVariant = "solid";
  } else if (variant === "solid" || variant === "outline" || variant === "ghost") {
    resolvedVariant = variant;
  }

  return (
    <button
      ref={ref}
      className={cn(
        styles.base,
        styles[`variant-${resolvedVariant}`],
        styles[`color-${resolvedColor}`],
        styles[`shape-${shape}`],
        styles[`size-${size}`],
        fullWidth && styles.fullWidth,
        className
      )}
      disabled={disabled || loading}
      {...props}>
      {loading && <Spinner size="sm" color="current" />}
      {children}
    </button>
  );
}
