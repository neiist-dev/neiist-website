import React from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";

export interface RadioProps extends Omit<React.ComponentPropsWithRef<"input">, "type"> {
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export function Radio({
  value,
  label,
  description,
  className,
  disabled,
  checked,
  defaultChecked,
  onChange,
  name,
  ref,
  ...props
}: RadioProps) {
  return (
    <label className={cn(styles.wrapper, disabled && styles.wrapperDisabled, className)}>
      <input
        ref={ref}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
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
