"use client";

import React, { createContext, useId } from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";

export interface RadioGroupContextValue {
  name: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (_value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<React.ComponentPropsWithRef<"fieldset">, "onChange"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (_value: string) => void;
  direction?: "row" | "column";
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onChange,
  direction = "column",
  label,
  error,
  disabled,
  children,
  className,
  ref,
  ...props
}: RadioGroupProps) {
  const defaultId = useId();
  const groupName = name ?? `radio-group-${defaultId}`;

  return (
    <fieldset
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cn(styles.group, styles[`group-${direction}`], className)}
      {...props}>
      {label && <legend className={styles.groupLabel}>{label}</legend>}

      <RadioGroupContext
        value={{
          name: groupName,
          value,
          defaultValue,
          disabled,
          onChange,
        }}>
        {children}
      </RadioGroupContext>

      {error && <span className={styles.errorText}>{error}</span>}
    </fieldset>
  );
}
