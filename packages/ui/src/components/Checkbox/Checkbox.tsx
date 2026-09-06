import { ComponentPropsWithRef, useRef, useEffect } from "react";
import styles from "./Checkbox.module.css";
import { cn } from "../../utils/cn";
import { useMergedRef } from "../../utils/useMergedRef";
import { FiCheck, FiMinus } from "react-icons/fi";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  label?: string;
  indeterminate?: boolean;
}

export function Checkbox({ label, className, indeterminate, ref, ...props }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(inputRef, ref);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <label className={cn(styles.wrapper, className)}>
      <input type="checkbox" ref={mergedRef} className={styles.input} {...props} />
      <span className={styles.visualBox}>
        <FiCheck className={styles.checkIcon} />
        <FiMinus className={styles.indeterminateIcon} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
