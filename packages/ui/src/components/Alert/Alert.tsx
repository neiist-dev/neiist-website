"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import styles from "./Alert.module.css";
import { cn } from "../../utils/cn";

import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
  FiX,
} from "react-icons/fi";

export type AlertVariant = "success" | "error" | "warning" | "info" | "loading";

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
  loading: FiLoader,
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
        <FiX size={14} />
      </button>
    </div>
  );
}

let syncToasterHost: (() => void) | null = null;

function createToast(variant: AlertVariant) {
  return (message: string, options?: AlertOptions) => {
    syncToasterHost?.();
    return sonnerToast.custom(
      (id) => (
        <Toast
          id={id}
          title={message}
          description={options?.description}
          variant={variant}
          closeLabel={options?.closeLabel}
        />
      ),
      {
        duration: variant === "loading" && !options?.duration ? Infinity : options?.duration,
        style: { background: "transparent" },
      }
    );
  };
}

export const Alert = {
  success: createToast("success"),
  error: createToast("error"),
  info: createToast("info"),
  warning: createToast("warning"),
  loading: createToast("loading"),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export interface ToasterProps {
  position?:
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  offset?: string | number | { top?: string; right?: string; bottom?: string; left?: string };
}

export function Toaster({ position = "top-right", offset }: ToasterProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.display = "contents";

    const sync = () => {
      const openDialogs = document.querySelectorAll<HTMLElement>(
        "dialog[open]:not([data-closing])"
      );
      const target = openDialogs[openDialogs.length - 1] ?? document.body;

      if (el.parentElement !== target) target.appendChild(el);
    };

    sync();
    syncToasterHost = sync;
    setHost(el);

    const observer = new MutationObserver((mutations) => {
      if (!el.isConnected || mutations.some((m) => m.type === "attributes")) sync();
    });

    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ["open", "data-closing"],
    });

    return () => {
      observer.disconnect();
      if (syncToasterHost === sync) syncToasterHost = null;
      el.remove();
    };
  }, []);

  if (!host) return null;

  return createPortal(<SonnerToaster position={position} offset={offset} />, host);
}
