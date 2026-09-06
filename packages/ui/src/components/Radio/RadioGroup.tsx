"use client";

import React, { useId } from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";
import { RadioGroupContext } from "./Radio";

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
  const groupName = name || `radio-group-${defaultId}`;

  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  return (
    <RadioGroupContext
      value={{
        name: groupName,
        value: currentValue,
        onChange: handleChange,
        disabled,
      }}>
      <fieldset
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={cn(styles.group, styles[`group-${direction}`], className)}
        {...props}>
        {label && <legend className={styles.groupLabel}>{label}</legend>}
        {children}
        {error && <span className={styles.errorText}>{error}</span>}
      </fieldset>
    </RadioGroupContext>
  );
}
