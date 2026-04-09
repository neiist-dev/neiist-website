import { FaCheck, FaSpinner } from "react-icons/fa";
import styles from "@/styles/components/shop/PaymentProcessingSpinner.module.css";

interface PaymentProcessingSpinnerProps {
  flowState?: "processing" | "success";
  title: string;
  subtitle?: string;
  size?: number;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function PaymentProcessingSpinner({
  flowState = "processing",
  title,
  subtitle,
  size = 48,
  actionLabel,
  actionHref,
  onAction,
}: PaymentProcessingSpinnerProps) {
  const isSuccess = flowState === "success";

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {isSuccess ? (
          <div className={styles.successIcon}>
            <FaCheck size={Math.max(20, Math.round(size * 0.6))} />
          </div>
        ) : (
          <FaSpinner size={size} className={styles.spinner} />
        )}
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
