import { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./Field.module.css";
import { cn } from "../../utils/cn";

export interface FieldProps extends ComponentPropsWithRef<"div"> {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  description,
  children,
  className,
  ref,
  ...props
}: FieldProps) {
  return (
    <div ref={ref} className={cn(styles.field, className)} {...props}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
      </label>
      {description && <span className={styles.description}>{description}</span>}
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
