import { ComponentPropsWithRef } from "react";
import styles from "./ToggleSwitch.module.css";
import { cn } from "../../utils/cn";

export interface ToggleSwitchProps extends Omit<ComponentPropsWithRef<"button">, "onChange"> {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  size?: "sm" | "md";
}

export function ToggleSwitch({
  checked,
  onChange,
  size = "md",
  className = "",
  disabled,
  ref,
  ...props
}: ToggleSwitchProps) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        styles.toggleSwitch,
        styles[`size-${size}`],
        checked && styles.toggleSwitchActive,
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      {...props}>
      <span className={styles.toggleKnob} />
    </button>
  );
}
