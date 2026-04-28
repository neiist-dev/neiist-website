import styles from "@/styles/components/layout/ConfirmDialog.module.css";

export default function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  dict,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  dict: {
    confirm: string;
    cancel: string;
  }

}) {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button className={styles.confirm} onClick={onConfirm}>
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
