"use client";

import React from "react";
import styles from "./TableFilter.module.css";
import { Checkbox } from "../Checkbox/Checkbox";
import { Popover } from "../Popover/Popover";
import { Button } from "../Button/Button";

export interface TableFilterMultiSelectProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  selected: string[];
  onChange: (_selected: string[]) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  getLabel?: (_option: string) => string;
  clearLabel: string;
  applyLabel: string;
  showFooter?: boolean;
}

export function TableFilterMultiSelect({
  isOpen,
  onClose,
  options,
  selected,
  onChange,
  buttonRef,
  title,
  getLabel,
  clearLabel,
  applyLabel,
  showFooter = false,
}: TableFilterMultiSelectProps) {
  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={buttonRef}
      className={styles.dropdown}
      width="max-content"
      align="end"
      mobileDrawerPosition="right"
      mobileDrawerTitle={title}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </header>
      <div className={styles.list}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <div key={option} className={styles.listItem}>
              <Checkbox
                className={styles.checkboxFull}
                label={getLabel ? getLabel(option) : option}
                checked={isSelected}
                onChange={() => toggleOption(option)}
              />
            </div>
          );
        })}
      </div>
      {showFooter && (
        <footer className={styles.footer}>
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            className={styles.footerBtn}
            onClick={() => onChange([])}>
            {clearLabel}
          </Button>
          <Button
            variant="solid"
            color="primary"
            size="sm"
            className={styles.footerBtn}
            onClick={onClose}>
            {applyLabel}
          </Button>
        </footer>
      )}
    </Popover>
  );
}
