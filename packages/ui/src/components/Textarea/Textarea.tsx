import React, { useId } from "react";
import styles from "./Textarea.module.css";
import { cn } from "../../utils/cn";

export interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: "none" | "vertical" | "both";
}

export function Textarea({
  label,
  error,
  helperText,
  resize = "vertical",
  className,
  id,
  ref,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(styles.textarea, styles[`resize-${resize}`], !!error && styles.hasError)}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
