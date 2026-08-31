import styles from "@/styles/components/layout/ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  message,
  confirmText = "Sim",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmText?: string;
  cancelText?: string;
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
            {confirmText}
          </button>
          <button className={styles.cancel} onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
