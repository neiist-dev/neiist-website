import React from "react";
import styles from "@/styles/components/layout/ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button className={styles.confirm} onClick={onConfirm}>
            Sim
          </button>
          <button className={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
