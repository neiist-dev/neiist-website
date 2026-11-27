"use client";

import React, { useId } from "react";
import styles from "./Textarea.module.css";
import { cn } from "../../utils/cn";
import { useRequiredValidation, type RequiredFieldProps } from "../../utils/useRequiredValidation";

export type TextareaProps = Omit<React.ComponentPropsWithRef<"textarea">, "required"> &
  RequiredFieldProps & {
    label?: string;
    error?: string;
    helperText?: string;
    resize?: "none" | "vertical" | "both";
  };

export function Textarea({
  label,
  error,
  helperText,
  required,
  requiredMessage,
  resize = "vertical",
  className,
  id,
  ref,
  onBlur,
  onInvalid,
  onChange,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const { hasError, errorMessage, handleBlur, handleInvalid, handleChange } =
    useRequiredValidation<HTMLTextAreaElement>({
      required,
      requiredMessage,
      value: props.value,
      defaultValue: props.defaultValue,
      error,
      onBlur,
      onInvalid,
      onChange,
    });

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        aria-invalid={hasError || undefined}
        className={cn(styles.textarea, styles[`resize-${resize}`], hasError && styles.hasError)}
        onBlur={handleBlur}
        onInvalid={handleInvalid}
        onChange={handleChange}
        {...props}
      />
      {errorMessage && <span className={styles.errorText}>{errorMessage}</span>}
      {!errorMessage && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
