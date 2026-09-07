import React, { useId } from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";
import { RadioProps } from "./Radio";

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

  const renderedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement<RadioProps>(child)) return child;

    const itemValue = child.props.value;
    const isChecked = value !== undefined ? value === itemValue : child.props.checked;

    const isDefaultChecked =
      defaultValue !== undefined ? defaultValue === itemValue : child.props.defaultChecked;

    return React.cloneElement(child, {
      name: child.props.name ?? groupName,
      checked: isChecked,
      defaultChecked: isChecked !== undefined ? undefined : isDefaultChecked,
      disabled: child.props.disabled ?? disabled,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        child.props.onChange?.(event);
        if (event.target.checked && onChange) {
          onChange(itemValue);
        }
      },
    });
  });

  return (
    <fieldset
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cn(styles.group, styles[`group-${direction}`], className)}
      {...props}>
      {label && <legend className={styles.groupLabel}>{label}</legend>}
      {renderedChildren}
      {error && <span className={styles.errorText}>{error}</span>}
    </fieldset>
  );
}
