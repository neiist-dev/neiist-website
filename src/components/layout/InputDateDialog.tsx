"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/components/layout/InputDateDialog.module.css";

export default function InputDateDialog({
  open,
  title,
  initialValue,
  placeholder,
  onConfirm,
  onCancel,
  dict,
}: {
  open: boolean;
  title?: string;
  initialValue?: string | null;
  placeholder?: string;
  onConfirm: (_value: string | null) => void;
  onCancel: () => void;
  dict: {
    hint: string;
    confirm: string;
    cancel: string;
  }
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
          <input
            className={styles.input}
            type="date"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className={styles.hint}>{dict.hint}</div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.confirm}
            onClick={() => onConfirm(value.trim() === "" ? null : value)}>
            {dict.confirm}
          </button>
          <button className={styles.cancel} onClick={onCancel}>
            {dict.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
