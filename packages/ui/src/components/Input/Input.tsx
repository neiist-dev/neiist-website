import React, { useId } from "react";
import styles from "./Input.module.css";
import { cn } from "../../utils/cn";

export interface InputProps extends React.ComponentPropsWithRef<"input"> {
  label?: string;
  error?: boolean | string;
  helperText?: string;
}

export function Input({ label, error, helperText, className, id, ref, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={hasError || undefined}
        className={cn(styles.input, hasError && styles.hasError)}
        {...props}
      />
      {errorMessage && <span className={styles.errorText}>{errorMessage}</span>}
      {!errorMessage && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
