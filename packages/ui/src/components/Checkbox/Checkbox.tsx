"use client";

import { RefObject, ComponentPropsWithRef, useEffect, useRef } from "react";
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
  const localRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localRef.current) localRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  useEffect(() => {
    if (typeof ref === "function") {
      ref(localRef.current);
    } else if (ref) {
      (ref as RefObject<HTMLInputElement | null>).current = localRef.current;
    }
  }, [ref]);

  return (
    <label className={cn(styles.wrapper, className)}>
      <input {...props} ref={localRef} type="checkbox" className={styles.input} />
      <span className={styles.visualBox}>
        {indeterminate ? <FiMinus className={styles.icon} /> : <FiCheck className={styles.icon} />}
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
