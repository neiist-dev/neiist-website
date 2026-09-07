"use client";

import { useState, useRef, useEffect, ComponentPropsWithRef } from "react";
import styles from "./Select.module.css";
import { cn } from "../../utils/cn";
import { Popover } from "../Popover/Popover";
import { FiChevronDown } from "react-icons/fi";
import { FaCheck } from "react-icons/fa6";
import { useMergedRef } from "../../utils/useMergedRef";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<"button">, "onChange"> {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (_value: string) => void;
  label?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
  selectLabel?: string;
}

export function Select({
  options,
  placeholder = "",
  value,
  onChange,
  label,
  title,
  className,
  disabled,
  selectLabel,
  ref,
  ...props
}: SelectProps) {
  const backupRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useMergedRef(ref, backupRef);
  const [isOpen, setIsOpen] = useState(false);

  const [internalValue, setInternalValue] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleSelect = (selectedVal: string) => {
    setInternalValue(selectedVal);
    onChange?.(selectedVal);
    setIsOpen(false);
    backupRef.current?.focus();
  };

  const selectedOption = options.find((option) => option.value === internalValue);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={cn(styles.root, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(styles.trigger, isOpen && styles.triggerOpen)}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        {...props}>
        <span className={cn(styles.value, !selectedOption && styles.placeholder)}>
          {displayLabel}
        </span>
        <FiChevronDown className={cn(styles.chevron, isOpen && styles.chevronOpen)} />
      </button>

      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={backupRef}
        matchAnchorWidth
        mobileDrawerTitle={label || title || placeholder || selectLabel}
        className={styles.popoverMenu}>
        <div className={styles.optionList} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === internalValue;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelect(option.value);
                  }
                }}
                className={cn(styles.option, isSelected && styles.optionSelected)}
                onClick={() => handleSelect(option.value)}>
                <span className={styles.optionIcon}>{isSelected && <FaCheck />}</span>
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
