"use client";

import React, { useId } from "react";
import styles from "./Input.module.css";
import { cn } from "../../utils/cn";
import { useRequiredValidation, type RequiredFieldProps } from "../../utils/useRequiredValidation";

export type InputProps = Omit<React.ComponentPropsWithRef<"input">, "required"> &
  RequiredFieldProps & {
    label?: string;
    error?: boolean | string;
    helperText?: string;
  };

export function Input({
  label,
  error,
  helperText,
  required,
  requiredMessage,
  className,
  id,
  ref,
  onBlur,
  onInvalid,
  onChange,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const { hasError, errorMessage, handleBlur, handleInvalid, handleChange } =
    useRequiredValidation<HTMLInputElement>({
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
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={hasError || undefined}
        className={cn(styles.input, hasError && styles.hasError)}
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
