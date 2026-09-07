"use client";

import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import styles from "./Alert.module.css";
import { cn } from "../../utils/cn";

import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo } from "react-icons/fi";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertOptions {
  description?: string;
  duration?: number;
  closeLabel?: string;
}

export interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  variant: AlertVariant;
  closeLabel?: string;
}

const variantIcons: Record<
  AlertVariant,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

function Toast({ id, title, description, variant, closeLabel = "Close" }: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div className={cn(styles.toast, styles[variant])} role="alert">
      <span className={styles.iconWrapper}>
        <Icon size={18} className={styles.variantIcon} />
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <button
        className={styles.closeButton}
        onClick={() => sonnerToast.dismiss(id)}
        aria-label={closeLabel}
        type="button">
        ✕
      </button>
    </div>
  );
}

function createToast(variant: AlertVariant) {
  return (message: string, options?: AlertOptions) =>
    sonnerToast.custom(
      (id) => (
        <Toast
          id={id}
          title={message}
          description={options?.description}
          variant={variant}
          closeLabel={options?.closeLabel}
        />
      ),
      { duration: options?.duration }
    );
}

export const Alert = {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
};

export interface ToasterProps {
  position?:
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  offset?: string | number | { top?: string; right?: string; bottom?: string; left?: string };
}

export function Toaster({ position = "top-right", offset }: ToasterProps) {
  return <SonnerToaster position={position} offset={offset} />;
}
