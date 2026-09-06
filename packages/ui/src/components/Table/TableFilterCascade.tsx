"use client";

import React, { useState } from "react";
import styles from "./TableFilterCascade.module.css";
import { Checkbox } from "../Checkbox/Checkbox";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { Popover } from "../Popover/Popover";

export interface CascadeFilterOption {
  id: string;
  label: string;
  price?: number;
  subtitle?: string;
  levelLabel?: string;
  children?: CascadeFilterOption[];
}

export interface TableFilterCascadeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: CascadeFilterOption[];
  selected: string[];
  onChange: (_selected: string[]) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  formatPrice?: (_price: number) => string;
  className?: string;
}

export function getCascadeLeafIds(option: CascadeFilterOption): string[] {
  if (!option.children || option.children.length === 0) {
    return [option.id];
  }
  return option.children.flatMap(getCascadeLeafIds);
}

export function getCascadeSelectionState(
  option: CascadeFilterOption,
  selected: string[]
): { isChecked: boolean; isIndeterminate: boolean } {
  const leafIds = getCascadeLeafIds(option);
  if (leafIds.length === 0) {
    return { isChecked: false, isIndeterminate: false };
  }
  const selectedCount = leafIds.filter((id) => selected.includes(id)).length;
  const isChecked = selectedCount === leafIds.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < leafIds.length;
  return { isChecked, isIndeterminate };
}

export function TableFilterCascade({
  isOpen,
  onClose,
  title,
  options,
  selected,
  onChange,
  buttonRef,
  formatPrice,
  className,
}: TableFilterCascadeProps) {
  const [navStack, setNavStack] = useState<CascadeFilterOption[]>([]);

  // When closed, reset drill-down state
  const handleClose = () => {
    setNavStack([]);
    onClose();
  };

  const currentParent = navStack.length > 0 ? navStack[navStack.length - 1] : null;
  const currentOptions = currentParent?.children ?? options;

  const handleGoBack = () => {
    setNavStack((prev) => prev.slice(0, -1));
  };

  const handleDrillDown = (option: CascadeFilterOption) => {
    if (option.children && option.children.length > 0) {
      setNavStack((prev) => [...prev, option]);
    }
  };

  const toggleOptionSelection = (option: CascadeFilterOption) => {
    const leafIds = getCascadeLeafIds(option);
    const { isChecked } = getCascadeSelectionState(option, selected);

    if (isChecked) {
      // Unselect all leaves
      onChange(selected.filter((id) => !leafIds.includes(id)));
    } else {
      // Select all leaves
      const newSelected = [...selected];
      for (const id of leafIds) {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      }
      onChange(newSelected);
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      anchorRef={buttonRef}
      className={className}
      width="max-content"
      align="end"
      mobileDrawerPosition="right"
      mobileDrawerTitle={title}>
      <div className={styles.dropdown}>
        {navStack.length === 0 ? (
          <header className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
          </header>
        ) : (
          <>
            <header>
              <button type="button" className={styles.cascadeHeader} onClick={handleGoBack}>
                <span className={styles.backIcon}>
                  <MdChevronLeft size={20} />
                </span>
                <span className={styles.cascadeHeaderText}>{currentParent?.label}</span>
              </button>
            </header>
            {currentParent?.levelLabel && (
              <div className={styles.cascadeLevelLabel}>{currentParent.levelLabel}</div>
            )}
          </>
        )}

        <ul className={styles.list}>
          {currentOptions.map((option) => {
            const hasChildren = Boolean(option.children && option.children.length > 0);
            const { isChecked, isIndeterminate } = getCascadeSelectionState(option, selected);

            return (
              <li key={option.id} className={styles.cascadeItem}>
                <label className={styles.cascadeItemLeft}>
                  <Checkbox
                    checked={isChecked}
                    indeterminate={isIndeterminate}
                    onChange={() => toggleOptionSelection(option)}
                  />
                  <span className={styles.cascadeItemLabel}>{option.label}</span>
                  {option.price != null && (
                    <span className={styles.cascadeSubtitle}>
                      {formatPrice
                        ? formatPrice(option.price)
                        : new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: "EUR",
                          }).format(option.price)}
                    </span>
                  )}
                  {option.subtitle && (
                    <span className={styles.cascadeSubtitle}>{option.subtitle}</span>
                  )}
                </label>

                {hasChildren && (
                  <button
                    type="button"
                    className={styles.drillDownBtn}
                    aria-label={`View ${option.label}`}
                    onClick={() => handleDrillDown(option)}>
                    <MdChevronRight className={styles.cascadeArrow} size={18} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Popover>
  );
}
