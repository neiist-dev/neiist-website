"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/shop/ColumnFilter.module.css";
import { FiCheck } from "react-icons/fi";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  ProductCascadeItem,
  getCascadeSelectionState,
  getValuesForCascade,
  matchesSelections,
  toggleCascadeSelection,
} from "@/utils/shop/orderFilterUtils";
import { isColorKey, splitNameHex } from "@/utils/shop/shopUtils";

export interface MultiSelectFilterProps {
  isOpen: boolean;
  onClose: () => void;
  options?: string[];
  cascadeOptions?: ProductCascadeItem[];
  selected: string[];
  onChange: (_selected: string[]) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  title: string;
  getLabel?: (_option: string) => string;
}

interface CascadeState {
  product: ProductCascadeItem;
  optionKeys: string[];
  selections: Record<string, string>;
}

function calculatePosition(button: HTMLButtonElement): { top: number; left: number } {
  const rect = button.getBoundingClientRect();
  const dropdownWidth = 300;
  const spacing = 8;
  const left = Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 16);
  return {
    top: rect.bottom + spacing,
    left: Math.max(16, left),
  };
}

export default function MultiSelectFilter({
  isOpen,
  onClose,
  options,
  cascadeOptions,
  selected,
  onChange,
  buttonRef,
  title,
  getLabel,
}: MultiSelectFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [cascade, setCascade] = useState<CascadeState | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      setCascade(null);
      return;
    }

    const updatePosition = () => {
      if (buttonRef.current) {
        setPosition(calculatePosition(buttonRef.current));
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutside =
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target);

      if (isOutside) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, buttonRef, onClose]);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const cascadeBack = () => {
    if (!cascade) return;
    const entries = Object.entries(cascade.selections);
    if (entries.length === 0) {
      setCascade(null);
      return;
    }
    const newSelections = Object.fromEntries(entries.slice(0, -1));
    setCascade({ ...cascade, selections: newSelections });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={styles.dropdown}
      style={
        position
          ? {
              position: "absolute",
              top: `${position.top}px`,
              left: `${position.left}px`,
            }
          : undefined
      }>
      {cascadeOptions ? (
        cascade ? (
          (() => {
            const currentKeyIdx = Object.keys(cascade.selections).length;
            const currentKey = cascade.optionKeys[currentKeyIdx];
            const values = getValuesForCascade(cascade.product, cascade.selections);

            return (
              <>
                <div className={styles.cascadeHeader} onClick={cascadeBack}>
                  <MdChevronLeft size={18} />
                  <span className={styles.cascadeHeaderText}>
                    {cascade.product.name}
                    {Object.entries(cascade.selections).map(([key, val]) => (
                      <span key={key} className={styles.cascadeCrumb}>
                        {" "}
                        ›{" "}
                        {isColorKey(key)
                          ? splitNameHex(val).name || splitNameHex(val).hex || val
                          : val}
                      </span>
                    ))}
                  </span>
                </div>
                <div className={styles.cascadeLevelLabel}>{currentKey}</div>
                <div className={styles.list}>
                  {values.map((val) => {
                    const newSelections = { ...cascade.selections, [currentKey]: val };
                    const { isChecked, isIndeterminate } = getCascadeSelectionState(
                      cascade.product,
                      newSelections,
                      selected
                    );
                    const isColor = isColorKey(currentKey);
                    const { name: colorName, hex } = isColor
                      ? splitNameHex(val)
                      : { name: val, hex: "" };
                    const hasNextLevel = cascade.optionKeys
                      .slice(currentKeyIdx + 1)
                      .some((k) =>
                        cascade.product.variants.some(
                          (v) => matchesSelections(v.options, newSelections) && v.options[k]
                        )
                      );

                    return (
                      <div
                        key={`${currentKey}-${val}`}
                        className={styles.cascadeItem}
                        onClick={() => {
                          if (!hasNextLevel) {
                            onChange(
                              toggleCascadeSelection(cascade.product, newSelections, selected)
                            );
                          } else {
                            setCascade({ ...cascade, selections: newSelections });
                          }
                        }}>
                        <div className={styles.cascadeItemLeft}>
                          <div
                            className={`${styles.checkbox} ${
                              isChecked
                                ? styles.checked
                                : isIndeterminate
                                  ? styles.indeterminate
                                  : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(
                                toggleCascadeSelection(cascade.product, newSelections, selected)
                              );
                            }}>
                            {isChecked && <FiCheck size={14} />}
                            {isIndeterminate && <span className={styles.indeterminateIcon}>−</span>}
                          </div>
                          <span className={styles.cascadeItemLabel}>
                            {isColor && hex && (
                              <span className={styles.colorSwatch} style={{ background: hex }} />
                            )}
                            {colorName || val}
                          </span>
                        </div>
                        {hasNextLevel && (
                          <MdChevronRight className={styles.cascadeArrow} size={18} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()
        ) : (
          <>
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
            </div>
            <div className={styles.list}>
              {cascadeOptions.map((product) => {
                const hasOptions = product.optionKeys.length > 0;
                const { isChecked, isIndeterminate } = getCascadeSelectionState(
                  product,
                  {},
                  selected
                );

                return (
                  <div
                    key={product.name}
                    className={styles.cascadeItem}
                    onClick={() => {
                      if (hasOptions) {
                        setCascade({
                          product,
                          optionKeys: product.optionKeys,
                          selections: {},
                        });
                      } else {
                        onChange(toggleCascadeSelection(product, {}, selected));
                      }
                    }}>
                    <div className={styles.cascadeItemLeft}>
                      <div
                        className={`${styles.checkbox} ${
                          isChecked ? styles.checked : isIndeterminate ? styles.indeterminate : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(toggleCascadeSelection(product, {}, selected));
                        }}>
                        {isChecked && <FiCheck size={14} />}
                        {isIndeterminate && <span className={styles.indeterminateIcon}>−</span>}
                      </div>
                      <span className={styles.cascadeItemLabel}>{product.name}</span>
                      {product.price != null && (
                        <span className={styles.cascadeSubtitle}>{product.price.toFixed(2)}€</span>
                      )}
                    </div>
                    {hasOptions && <MdChevronRight className={styles.cascadeArrow} size={18} />}
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        <>
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
          </div>
          <div className={styles.list}>
            {(options || []).map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div key={option} className={styles.listItem} onClick={() => toggleOption(option)}>
                  <div className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}>
                    {isSelected && <FiCheck size={14} />}
                  </div>
                  <span className={styles.label}>{getLabel ? getLabel(option) : option}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
