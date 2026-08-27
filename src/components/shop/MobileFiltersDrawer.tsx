"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/components/shop/MobileFiltersDrawer.module.css";
import { FiCheck, FiX } from "react-icons/fi";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  ProductCascadeItem,
  getCascadeSelectionState,
  getValuesForCascade,
  matchesSelections,
  toggleCascadeSelection,
} from "@/utils/shop/orderFilterUtils";
import { isColorKey, splitNameHex } from "@/utils/shop/shopUtils";

export interface MobileFilterGroup<T = Record<string, unknown>> {
  id: Extract<keyof T, string>;
  title: string;
  options?: string[];
  cascadeOptions?: ProductCascadeItem[];
  selected: string[];
  getLabel?: (_option: string) => string;
}

export interface BaseFilterState {
  dateRange: { start: Date | null; end: Date | null };
}

interface MobileFiltersDrawerProps<T extends BaseFilterState> {
  isOpen: boolean;
  onClose: () => void;
  initialFilters: T;
  onApplyFilters: (_filters: T) => void;
  filterGroups: MobileFilterGroup<T>[];
}

const WEEKDAYS = [
  { id: "sun", label: "D" },
  { id: "mon", label: "S" },
  { id: "tue", label: "T" },
  { id: "wed", label: "Q" },
  { id: "thu", label: "Q" },
  { id: "fri", label: "S" },
  { id: "sat", label: "S" },
] as const;

interface CalendarDaySlot {
  key: string;
  date: Date | null;
}

function getMonthDays(date: Date): CalendarDaySlot[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const leadingBlanks = (firstWeekday + 6) % 7;

  const days: CalendarDaySlot[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    days.push({ key: `blank-${year}-${month}-${i}`, date: null });
  }
  for (let day = 1; day <= lastDate; day++) {
    days.push({ key: `day-${year}-${month}-${day}`, date: new Date(year, month, day) });
  }
  return days;
}

function isSameDay(firstDate: Date, secondDate: Date): boolean {
  return firstDate.toDateString() === secondDate.toDateString();
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function toggleArrayItem<T>(array: T[], item: T): T[] {
  return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
}

export default function MobileFiltersDrawer<T extends BaseFilterState>({
  isOpen,
  onClose,
  initialFilters,
  onApplyFilters,
  filterGroups,
}: MobileFiltersDrawerProps<T>) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [dateMode, setDateMode] = useState<"until" | "range">("until");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [expandedSection, setExpandedSection] = useState<string | null>("date");
  const [cascadeState, setCascadeState] = useState<{
    product: ProductCascadeItem;
    optionKeys: string[];
    selections: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setCascadeState(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleItem = (key: Extract<keyof T, string>, item: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleArrayItem((prev[key] as unknown as string[]) || [], item),
    }));
  };

  const handleCascadeBack = () => {
    if (!cascadeState) return;
    const entries = Object.entries(cascadeState.selections);
    if (entries.length === 0) {
      setCascadeState(null);
      return;
    }
    setCascadeState({
      ...cascadeState,
      selections: Object.fromEntries(entries.slice(0, -1)),
    });
  };

  const handleDateSelect = (date: Date) => {
    if (dateMode === "until") {
      setFilters((prev) => ({ ...prev, dateRange: { start: null, end: date } }));
      return;
    }

    const { start, end } = filters.dateRange;
    if (!start || (start && end)) {
      setFilters((prev) => ({ ...prev, dateRange: { start: date, end: null } }));
    } else if (start && !end) {
      if (date < start) {
        setFilters((prev) => ({ ...prev, dateRange: { start: date, end: start } }));
      } else {
        setFilters((prev) => ({ ...prev, dateRange: { start, end: date } }));
      }
    }
  };

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  const handleClearAll = () => {
    const cleared = {
      dateRange: { start: null, end: null },
    } as unknown as T;
    filterGroups.forEach((g) => {
      (cleared as Record<string, unknown>)[g.id] = [];
    });
    setFilters(cleared);
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const activeFiltersCount =
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    filterGroups.reduce((acc, g) => acc + ((filters[g.id] as unknown as string[])?.length || 0), 0);

  if (!isOpen) return null;

  const days = getMonthDays(currentMonth);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filtros</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close filters">
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <FilterSection
            title="Data"
            badge={filters.dateRange.start || filters.dateRange.end ? 1 : 0}
            expanded={expandedSection === "date"}
            onToggle={() => toggleSection("date")}>
            <div className={styles.dateTabs}>
              <button
                type="button"
                className={dateMode === "until" ? styles.tabActive : styles.tab}
                onClick={() => setDateMode("until")}>
                Até data
              </button>
              <button
                type="button"
                className={dateMode === "range" ? styles.tabActive : styles.tab}
                onClick={() => setDateMode("range")}>
                Intervalo
              </button>
            </div>

            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <button type="button" className={styles.navBtn} onClick={() => navigateMonth(-1)}>
                  ‹
                </button>
                <div className={styles.monthLabel}>
                  {currentMonth.toLocaleDateString("pt-PT", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <button type="button" className={styles.navBtn} onClick={() => navigateMonth(1)}>
                  ›
                </button>
              </div>

              <div className={styles.calendarGrid}>
                {WEEKDAYS.map((day) => (
                  <div key={day.id} className={styles.dayName}>
                    {day.label}
                  </div>
                ))}

                {days.map(({ key, date }) => {
                  if (!date) {
                    return <button key={key} type="button" className={styles.day} disabled />;
                  }

                  const { start, end } = filters.dateRange;
                  const isSelected =
                    (start && isSameDay(date, start)) || (end && isSameDay(date, end));
                  const isInRange = start && end && isDateInRange(date, start, end);

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.day} ${isSelected ? styles.selected : ""} ${
                        isInRange ? styles.inRange : ""
                      }`}
                      onClick={() => handleDateSelect(date)}>
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </FilterSection>

          {filterGroups.map((group) => {
            const currentSelected = (filters[group.id] as unknown as string[]) || [];

            return (
              <FilterSection
                key={group.id}
                title={group.title}
                badge={currentSelected.length || 0}
                expanded={expandedSection === group.id}
                onToggle={() => toggleSection(group.id)}>
                {group.cascadeOptions ? (
                  cascadeState ? (
                    (() => {
                      const currentKeyIdx = Object.keys(cascadeState.selections).length;
                      const currentKey = cascadeState.optionKeys[currentKeyIdx];
                      const values = getValuesForCascade(
                        cascadeState.product,
                        cascadeState.selections
                      );

                      return (
                        <div>
                          <div className={styles.cascadeHeader} onClick={handleCascadeBack}>
                            <MdChevronLeft size={20} />
                            <span className={styles.cascadeHeaderText}>
                              {cascadeState.product.name}
                              {Object.entries(cascadeState.selections).map(([key, val]) => (
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
                              const newSelections = {
                                ...cascadeState.selections,
                                [currentKey]: val,
                              };
                              const { isChecked, isIndeterminate } = getCascadeSelectionState(
                                cascadeState.product,
                                newSelections,
                                currentSelected
                              );
                              const isColor = isColorKey(currentKey);
                              const { name: colorName, hex } = isColor
                                ? splitNameHex(val)
                                : { name: val, hex: "" };
                              const hasNextLevel = cascadeState.optionKeys
                                .slice(currentKeyIdx + 1)
                                .some((k) =>
                                  cascadeState.product.variants.some(
                                    (v) =>
                                      matchesSelections(v.options, newSelections) && v.options[k]
                                  )
                                );

                              return (
                                <div
                                  key={`${currentKey}-${val}`}
                                  className={styles.cascadeItem}
                                  onClick={() => {
                                    if (!hasNextLevel) {
                                      const next = toggleCascadeSelection(
                                        cascadeState.product,
                                        newSelections,
                                        currentSelected
                                      );
                                      setFilters((prev) => ({ ...prev, [group.id]: next }));
                                    } else {
                                      setCascadeState({
                                        ...cascadeState,
                                        selections: newSelections,
                                      });
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
                                        const next = toggleCascadeSelection(
                                          cascadeState.product,
                                          newSelections,
                                          currentSelected
                                        );
                                        setFilters((prev) => ({ ...prev, [group.id]: next }));
                                      }}>
                                      {isChecked && <FiCheck size={14} />}
                                      {isIndeterminate && (
                                        <span className={styles.indeterminateIcon}>−</span>
                                      )}
                                    </div>
                                    <span className={styles.cascadeItemLabel}>
                                      {isColor && hex && (
                                        <span
                                          className={styles.colorSwatch}
                                          style={{ background: hex }}
                                        />
                                      )}
                                      {colorName || val}
                                    </span>
                                  </div>
                                  {hasNextLevel && (
                                    <MdChevronRight className={styles.cascadeArrow} size={20} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className={styles.list}>
                      {group.cascadeOptions.map((product) => {
                        const hasOptions = product.optionKeys.length > 0;
                        const { isChecked, isIndeterminate } = getCascadeSelectionState(
                          product,
                          {},
                          currentSelected
                        );

                        return (
                          <div
                            key={product.name}
                            className={styles.cascadeItem}
                            onClick={() => {
                              if (hasOptions) {
                                setCascadeState({
                                  product,
                                  optionKeys: product.optionKeys,
                                  selections: {},
                                });
                              } else {
                                const next = toggleCascadeSelection(product, {}, currentSelected);
                                setFilters((prev) => ({ ...prev, [group.id]: next }));
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
                                  const next = toggleCascadeSelection(product, {}, currentSelected);
                                  setFilters((prev) => ({ ...prev, [group.id]: next }));
                                }}>
                                {isChecked && <FiCheck size={14} />}
                                {isIndeterminate && (
                                  <span className={styles.indeterminateIcon}>−</span>
                                )}
                              </div>
                              <span className={styles.cascadeItemLabel}>{product.name}</span>
                              {product.price != null && (
                                <span className={styles.cascadeSubtitle}>
                                  {product.price.toFixed(2)}€
                                </span>
                              )}
                            </div>
                            {hasOptions && (
                              <MdChevronRight className={styles.cascadeArrow} size={20} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className={styles.list}>
                    {(group.options || []).map((option) => (
                      <CheckboxItem
                        key={option}
                        label={group.getLabel ? group.getLabel(option) : option}
                        checked={currentSelected.includes(option)}
                        onToggle={() => toggleItem(group.id, option)}
                      />
                    ))}
                  </div>
                )}
              </FilterSection>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.clearBtn} onClick={handleClearAll}>
            Limpar Tudo
          </button>
          <button type="button" className={styles.applyBtn} onClick={handleApply}>
            Aplicar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>
      </div>
    </>
  );
}

function FilterSection({
  title,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  badge?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <button type="button" className={styles.sectionHeader} onClick={onToggle}>
        <span className={styles.sectionTitle}>
          {title}
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </span>
        <span className={styles.chevron}>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.listItem} onClick={onToggle}>
      <div className={`${styles.checkbox} ${checked ? styles.checked : ""}`}>
        {checked && <FiCheck size={14} />}
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
