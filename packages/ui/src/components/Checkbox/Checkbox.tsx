import { ComponentPropsWithRef, useCallback } from "react";
import { FiCheck, FiMinus } from "react-icons/fi";
import styles from "./Checkbox.module.css";
import { cn } from "../../utils/cn";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  className,
  indeterminate = false,
  ref,
  ...props
}: CheckboxProps) {
  const setRef = useCallback(
    (input: HTMLInputElement | null) => {
      if (input) {
        input.indeterminate = indeterminate;
      }

      if (typeof ref === "function") {
        ref(input);
      } else if (ref) {
        ref.current = input;
      }
    },
    [indeterminate, ref]
  );

  return (
    <label className={cn(styles.wrapper, className)}>
      <input {...props} ref={setRef} type="checkbox" className={styles.input} />
      <span className={styles.visualBox}>
        {indeterminate ? <FiMinus className={styles.icon} /> : <FiCheck className={styles.icon} />}
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
