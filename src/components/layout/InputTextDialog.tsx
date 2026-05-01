"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/components/layout/InputDateDialog.module.css";

export default function InputTextDialog({
  open,
  title,
  label,
  initialValue,
  placeholder,
  type = "text",
  hint,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  label?: string;
  initialValue?: string | null;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "search" | "url" | "password";
  hint?: string;
  confirmLabel?: string;
  onConfirm: (_value: string | null) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<string>(initialValue ?? "");

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue, open]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content}>
          {label && <div className={styles.label}>{label}</div>}
          <input
            className={styles.input}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {hint && <div className={styles.hint}>{hint}</div>}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.confirm}
            onClick={() => onConfirm(value.trim() === "" ? null : value)}>
            {confirmLabel}
          </button>
          <button className={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
