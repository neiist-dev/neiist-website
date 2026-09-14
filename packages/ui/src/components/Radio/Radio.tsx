import React, { use } from "react";
import styles from "./Radio.module.css";
import { cn } from "../../utils/cn";
import { RadioGroupContext } from "./RadioGroup";

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
  const group = use(RadioGroupContext);

  const radioName = name ?? group?.name;
  const radioDisabled = disabled ?? group?.disabled;
  const radioChecked = group?.value !== undefined ? group.value === value : checked;
  const radioDefaultChecked =
    radioChecked === undefined
      ? group?.defaultValue !== undefined
        ? group.defaultValue === value
        : defaultChecked
      : undefined;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.target.checked) group?.onChange?.(value);
  };

  return (
    <label className={cn(styles.wrapper, radioDisabled && styles.wrapperDisabled, className)}>
      <input
        ref={ref}
        type="radio"
        name={radioName}
        value={value}
        checked={radioChecked}
        defaultChecked={radioDefaultChecked}
        disabled={radioDisabled}
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
