import React from "react";
import styles from "@/styles/components/ToggleSwitch.module.css";

export interface ToggleSwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onChange: (_checked: boolean) => void;
}

export default function ToggleSwitch({
  checked,
  onChange,
  className = "",
  ...props
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggleSwitch} ${checked ? styles.toggleSwitchActive : ""} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      {...props}>
      <div className={styles.toggleKnob}></div>
    </button>
  );
}
