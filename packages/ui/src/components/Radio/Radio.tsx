"use client";

import React, { createContext, useContext } from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (_value: string) => void;
  disabled?: boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioProps extends Omit<
  React.ComponentPropsWithRef<"input">,
  "type" | "onChange"
> {
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  onChange?: (_event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Radio({
  value,
  label,
  description,
  className,
  disabled,
  checked,
  onChange,
  ref,
  ...props
}: RadioProps) {
  const group = useContext(RadioGroupContext);

  const isChecked = group?.value !== undefined ? group.value === value : checked;
  const isDisabled = disabled ?? group?.disabled ?? false;
  const name = props.name ?? group?.name;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (group?.onChange) {
      group.onChange(value);
    }
  };

  return (
    <label className={cn(styles.wrapper, isDisabled && styles.wrapperDisabled, className)}>
      <input
        ref={ref}
        type="radio"
        name={name}
        value={value}
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleChange}
        className={styles.input}
        {...props}
      />
      <span className={styles.visualRadio} />
      {(label || description) && (
        <div className={styles.labelWrapper}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </label>
  );
}
