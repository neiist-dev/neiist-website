import { ComponentPropsWithRef } from "react";
import styles from "./SearchInput.module.css";
import { cn } from "../../utils/cn";
import { FiSearch, FiX } from "react-icons/fi";

export interface SearchInputProps extends Omit<ComponentPropsWithRef<"input">, "onChange"> {
  value: string;
  onChange: (_value: string) => void;
  onClear?: () => void;
  className?: string;
  clearLabel?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  className,
  clearLabel,
  ref,
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <FiSearch className={styles.icon} size={16} />
      <input
        ref={ref}
        type="text"
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label={clearLabel}>
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}
