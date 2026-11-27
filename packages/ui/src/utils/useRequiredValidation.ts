"use client";

import { useState, FocusEventHandler, ReactEventHandler, ChangeEventHandler } from "react";

export type RequiredFieldProps =
  { required?: false; requiredMessage?: string } | { required: boolean; requiredMessage: string };

interface UseRequiredValidationParams<T extends HTMLInputElement | HTMLTextAreaElement> {
  required?: boolean;
  requiredMessage?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  error?: boolean | string;
  onBlur?: FocusEventHandler<T>;
  onInvalid?: ReactEventHandler<T>;
  onChange?: ChangeEventHandler<T>;
}

export function useRequiredValidation<T extends HTMLInputElement | HTMLTextAreaElement>({
  required,
  requiredMessage,
  value,
  defaultValue,
  error,
  onBlur,
  onInvalid,
  onChange,
}: UseRequiredValidationParams<T>) {
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [prevRequired, setPrevRequired] = useState(Boolean(required));
  const [uncontrolledEmpty, setUncontrolledEmpty] = useState(() => !defaultValue);

  if (Boolean(required) !== prevRequired) {
    setPrevRequired(Boolean(required));
    setShowRequiredError(Boolean(required));
  }

  const handleBlur: FocusEventHandler<T> = (event) => {
    if (required) {
      setShowRequiredError(true);
      setUncontrolledEmpty(event.currentTarget.value.trim() === "");
    }
    onBlur?.(event);
  };

  const handleInvalid: ReactEventHandler<T> = (event) => {
    if (required) {
      setShowRequiredError(true);
      setUncontrolledEmpty(event.currentTarget.value.trim() === "");
    }
    onInvalid?.(event);
  };

  const handleChange: ChangeEventHandler<T> = (event) => {
    if (value === undefined) setUncontrolledEmpty(event.currentTarget.value.trim() === "");

    onChange?.(event);
  };

  const isEmpty = value !== undefined ? String(value).trim() === "" : uncontrolledEmpty;
  const resolvedError =
    error || (required && showRequiredError && isEmpty ? requiredMessage : undefined);

  return {
    hasError: Boolean(resolvedError),
    errorMessage: typeof resolvedError === "string" ? resolvedError : undefined,
    handleBlur,
    handleInvalid,
    handleChange,
  };
}
