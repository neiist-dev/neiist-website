import { ComponentPropsWithRef } from "react";
import styles from "./Checkbox.module.css";
import { cn } from "../../utils/cn";
import { FiCheck, FiMinus } from "react-icons/fi";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export function Checkbox({ label, className, indeterminate, ref, ...props }: CheckboxProps) {
  return (
    <label className={cn(styles.wrapper, className)}>
      <input
        type="checkbox"
        ref={ref}
        className={styles.input}
        aria-checked={indeterminate ? "mixed" : undefined}
        {...props}
      />
      <span className={styles.visualBox}>
        <FiCheck className={styles.checkIcon} />
        <FiMinus className={styles.indeterminateIcon} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
