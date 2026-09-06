import React from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";
import styles from "./Spinner.module.css";
import { cn } from "../../utils/cn";

export type SpinnerSize = "sm" | "md" | "lg" | "xl" | number;
export type SpinnerColor = "primary" | "secondary" | "neutral" | "current" | string;

export interface SpinnerProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  state?: "loading" | "success";
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  label?: string;
}

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

const colorMap: Record<string, string> = {
  primary: "var(--ui-primary)",
  secondary: "var(--ui-secondary)",
  neutral: "var(--ui-fg-light)",
  current: "currentColor",
};

export function Spinner({
  size = "md",
  color = "primary",
  state,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  label,
  className,
  style,
  ref,
  ...props
}: SpinnerProps) {
  const pixelSize = typeof size === "number" ? size : (sizeMap[size] ?? 24);
  const resolvedColor = colorMap[color] ?? color;
  const effectiveState = state ?? "loading";
  const isSuccess = effectiveState === "success";
  const isCardMode = Boolean(title);
  const hasMorph = state !== undefined;

  const iconContent = hasMorph ? (
    <div className={styles.iconContainer} style={{ inlineSize: pixelSize, blockSize: pixelSize }}>
      <div
        className={cn(styles.successIcon, isSuccess ? styles.iconFadeIn : styles.iconFadeOut)}
        style={{ inlineSize: pixelSize, blockSize: pixelSize }}>
        <FaCheck size={Math.max(12, Math.round(pixelSize * 0.5))} />
      </div>
      <div className={cn(styles.spinnerLayer, !isSuccess ? styles.iconFadeIn : styles.iconFadeOut)}>
        <FaSpinner size={pixelSize} className={styles.spinner} style={{ color: resolvedColor }} />
      </div>
    </div>
  ) : (
    <FaSpinner size={pixelSize} className={styles.spinner} style={{ color: resolvedColor }} />
  );

  if (!isCardMode) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(styles.iconRoot, className)}
        style={style}
        {...props}>
        {iconContent}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-label={typeof title === "string" ? title : label}
      className={cn(styles.container, className)}
      style={style}
      {...props}>
      <div className={styles.wrapper}>
        {iconContent}
        <h2 className={styles.title}>{title}</h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {actionLabel ? (
        onAction ? (
          <button type="button" className={styles.actionButton} onClick={onAction}>
            {actionLabel}
          </button>
        ) : actionHref ? (
          <a className={styles.actionButton} href={actionHref}>
            {actionLabel}
          </a>
        ) : null
      ) : null}
    </div>
  );
}
