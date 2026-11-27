import { ComponentPropsWithRef, ReactNode } from "react";
import styles from "./Field.module.css";
import { cn } from "../../utils/cn";

export interface FieldProps extends ComponentPropsWithRef<"div"> {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  description,
  children,
  className,
  ref,
  ...props
}: FieldProps) {
  return (
    <div
      ref={ref}
      data-required={required || undefined}
      className={cn(styles.field, className)}
      {...props}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
      </label>
      {description && <span className={styles.description}>{description}</span>}
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
