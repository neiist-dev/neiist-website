"use client";

import React, { useState, useMemo } from "react";
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
  if (!option.children || option.children.length === 0) return [option.id];

  return option.children.flatMap(getCascadeLeafIds);
}

export function getCascadeSelectionState(
  option: CascadeFilterOption,
  selected: string[] | Set<string>
): { isChecked: boolean; isIndeterminate: boolean } {
  const leafIds = getCascadeLeafIds(option);
  if (leafIds.length === 0) return { isChecked: false, isIndeterminate: false };

  const selectedSet = selected instanceof Set ? selected : new Set(selected);
  const selectedCount = leafIds.filter((id) => selectedSet.has(id)).length;
  return {
    isChecked: selectedCount === leafIds.length,
    isIndeterminate: selectedCount > 0 && selectedCount < leafIds.length,
  };
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
  const selectedSet = useMemo(() => new Set(selected), [selected]);

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
    if (option.children && option.children.length > 0) setNavStack((prev) => [...prev, option]);
  };

  const toggleOptionSelection = (option: CascadeFilterOption) => {
    const leafIds = getCascadeLeafIds(option);
    const { isChecked } = getCascadeSelectionState(option, selectedSet);

    if (isChecked) {
      const leafSet = new Set(leafIds);
      onChange(selected.filter((id) => !leafSet.has(id)));
    } else {
      const next = new Set(selected);
      for (const id of leafIds) {
        next.add(id);
      }
      onChange(Array.from(next));
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
          <header>
            <button
              type="button"
              className={styles.cascadeHeader}
              onClick={handleGoBack}
              aria-label={`Voltar de ${currentParent?.label}`}>
              <MdChevronLeft size={20} className={styles.backIcon} />
              <span className={styles.cascadeHeaderText}>{currentParent?.label}</span>
            </button>
            {currentParent?.levelLabel && (
              <div className={styles.cascadeLevelLabel}>{currentParent.levelLabel}</div>
            )}
          </header>
        )}

        <ul className={styles.list}>
          {currentOptions.map((option) => {
            const hasChildren = Boolean(option.children && option.children.length > 0);
            const { isChecked, isIndeterminate } = getCascadeSelectionState(option, selectedSet);

            return (
              <li key={option.id} className={styles.cascadeItem}>
                <div
                  className={styles.cascadeItemLeft}
                  onClick={() => toggleOptionSelection(option)}>
                  <Checkbox
                    checked={isChecked}
                    indeterminate={isIndeterminate}
                    onChange={() => toggleOptionSelection(option)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={option.label}
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
                </div>

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
