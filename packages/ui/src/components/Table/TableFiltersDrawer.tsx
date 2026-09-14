"use client";

import React, { useState } from "react";
import styles from "./TableFiltersDrawer.module.css";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { Drawer } from "../Drawer/Drawer";
import { Accordion } from "../Accordion/Accordion";
import { Calendar } from "../Calendar/Calendar";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";
import { Checkbox } from "../Checkbox/Checkbox";
import type { Locale } from "date-fns";
import {
  CascadeFilterOption,
  getCascadeLeafIds,
  getCascadeSelectionState,
} from "./TableFilterCascade";

export interface FilterCategoryOption {
  label: string;
  value: string;
}

export interface TableFilterCategory {
  id: string;
  title: string;
  options?: (string | FilterCategoryOption)[];
  cascadeOptions?: CascadeFilterOption[];
  selected: string[];
}

export interface DateFilterRange {
  start: Date | null;
  end: Date | null;
}

export interface TableFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  closeAriaLabel: string;
  dateRange?: DateFilterRange;
  dateFilterTitle?: string;
  untilDateLabel?: string;
  rangeLabel?: string;
  clearLabel: string;
  applyLabel: string;
  locale: Locale;
  drillDownAriaLabel?: (_label: string) => string;
  categories: TableFilterCategory[];
  onApply: (_result: { dateRange: DateFilterRange; categories: Record<string, string[]> }) => void;
}

type DrawerFormProps = Omit<TableFiltersDrawerProps, "isOpen">;

function TableFiltersDrawerContent({
  onClose,
  title,
  closeAriaLabel,
  dateRange: initialDateRange,
  dateFilterTitle,
  untilDateLabel,
  rangeLabel,
  clearLabel,
  applyLabel,
  locale,
  drillDownAriaLabel,
  categories,
  onApply,
}: DrawerFormProps) {
  const [internalDateRange, setInternalDateRange] = useState<DateFilterRange>(
    initialDateRange ?? { start: null, end: null }
  );
  const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    categories.forEach((cat) => {
      map[cat.id] = [...cat.selected];
    });
    return map;
  });
  const [dateMode, setDateMode] = useState<"until" | "range">("until");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    initialDateRange !== undefined ? "date" : (categories[0]?.id ?? null)
  );
  const [cascadeNav, setCascadeNav] = useState<Record<string, CascadeFilterOption[]>>({});

  const toggleCategoryOption = (catId: string, value: string) => {
    setSelectedMap((prev) => {
      const current = prev[catId] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [catId]: updated };
    });
  };

  const handleCascadeBack = (catId: string) => {
    setCascadeNav((prev) => ({
      ...prev,
      [catId]: (prev[catId] || []).slice(0, -1),
    }));
  };

  const handleCascadeDrillDown = (catId: string, option: CascadeFilterOption) => {
    if (option.children && option.children.length > 0) {
      setCascadeNav((prev) => ({
        ...prev,
        [catId]: [...(prev[catId] || []), option],
      }));
    }
  };

  const toggleCascadeCategoryOption = (catId: string, option: CascadeFilterOption) => {
    const currentSelected = selectedMap[catId] || [];
    const leafIds = getCascadeLeafIds(option);
    const { isChecked } = getCascadeSelectionState(option, currentSelected);

    let nextSelected: string[];
    if (isChecked) {
      const leafSet = new Set(leafIds);
      nextSelected = currentSelected.filter((id) => !leafSet.has(id));
    } else {
      const next = new Set(currentSelected);
      for (const id of leafIds) {
        next.add(id);
      }
      nextSelected = Array.from(next);
    }

    setSelectedMap((prev) => ({
      ...prev,
      [catId]: nextSelected,
    }));
  };

  const handleClearAll = () => {
    setInternalDateRange({ start: null, end: null });
    const cleared: Record<string, string[]> = {};
    categories.forEach((category) => {
      cleared[category.id] = [];
    });
    setSelectedMap(cleared);
    setCascadeNav({});
  };

  const handleApply = () => {
    onApply({
      dateRange: internalDateRange,
      categories: selectedMap,
    });
    onClose();
  };

  const getCurrentCascadeOptions = (catId: string, baseOptions?: CascadeFilterOption[]) => {
    const nav = cascadeNav[catId];
    if (nav && nav.length > 0) return nav[nav.length - 1].children || [];

    return baseOptions || [];
  };

  const dateCount = internalDateRange.start || internalDateRange.end ? 1 : 0;
  const totalActiveCount =
    dateCount + Object.values(selectedMap).reduce((acc, items) => acc + items.length, 0);

  return (
    <>
      <Drawer.Header title={title} onClose={onClose} closeLabel={closeAriaLabel} />
      <Drawer.Body>
        <Accordion
          type="single"
          variant="flush"
          value={expandedSection || ""}
          onValueChange={(val) => setExpandedSection((val as string) || null)}>
          {initialDateRange !== undefined && (
            <Accordion.Item value="date">
              <Accordion.Trigger>
                <span className={styles.sectionTitle}>
                  {dateFilterTitle}
                  {dateCount > 0 && (
                    <Badge variant="primary" size="sm">
                      {dateCount}
                    </Badge>
                  )}
                </span>
              </Accordion.Trigger>
              <Accordion.Content>
                <div className={styles.dateTabs} role="group" aria-label={dateFilterTitle}>
                  <button
                    type="button"
                    className={styles.tab}
                    data-active={dateMode === "until"}
                    aria-pressed={dateMode === "until"}
                    onClick={() => {
                      setDateMode("until");
                      setInternalDateRange({ start: null, end: internalDateRange.end });
                    }}>
                    {untilDateLabel}
                  </button>
                  <button
                    type="button"
                    className={styles.tab}
                    data-active={dateMode === "range"}
                    aria-pressed={dateMode === "range"}
                    onClick={() => setDateMode("range")}>
                    {rangeLabel}
                  </button>
                </div>

                <div className={styles.calendarWrapper}>
                  {dateMode === "until" ? (
                    <Calendar
                      mode="single"
                      locale={locale}
                      selected={internalDateRange.end || undefined}
                      onSelect={(date) => setInternalDateRange({ start: null, end: date || null })}
                    />
                  ) : (
                    <Calendar
                      mode="range"
                      locale={locale}
                      selected={{
                        from: internalDateRange.start || undefined,
                        to: internalDateRange.end || undefined,
                      }}
                      onSelect={(range) =>
                        setInternalDateRange({
                          start: range?.from || null,
                          end: range?.to || null,
                        })
                      }
                    />
                  )}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          )}

          {categories.map((category) => {
            const currentSelected = selectedMap[category.id] || [];
            const currentNav = cascadeNav[category.id] || [];
            const currentParent = currentNav.length > 0 ? currentNav[currentNav.length - 1] : null;
            const currentOptions = getCurrentCascadeOptions(category.id, category.cascadeOptions);

            return (
              <Accordion.Item key={category.id} value={category.id}>
                <Accordion.Trigger>
                  <span className={styles.sectionTitle}>
                    {category.title}
                    {currentSelected.length > 0 && (
                      <Badge variant="primary" size="sm">
                        {currentSelected.length}
                      </Badge>
                    )}
                  </span>
                </Accordion.Trigger>
                <Accordion.Content>
                  {category.cascadeOptions && (
                    <>
                      {currentParent && (
                        <>
                          <button
                            type="button"
                            className={styles.cascadeHeader}
                            onClick={() => handleCascadeBack(category.id)}
                            aria-label={`Voltar de ${currentParent.label}`}>
                            <MdChevronLeft size={20} />
                            <span>{currentParent.label}</span>
                          </button>
                          {currentParent.levelLabel && (
                            <div className={styles.cascadeLevelLabel}>
                              {currentParent.levelLabel}
                            </div>
                          )}
                        </>
                      )}
                      <div className={styles.list}>
                        {currentOptions.map((option) => {
                          const hasChildren = Boolean(
                            option.children && option.children.length > 0
                          );
                          const { isChecked, isIndeterminate } = getCascadeSelectionState(
                            option,
                            currentSelected
                          );

                          return (
                            <div key={option.id} className={styles.listItem}>
                              <Checkbox
                                label={option.label}
                                checked={isChecked}
                                indeterminate={isIndeterminate}
                                onChange={() => toggleCascadeCategoryOption(category.id, option)}
                              />

                              {hasChildren && (
                                <button
                                  type="button"
                                  className={styles.drillDownBtn}
                                  aria-label={
                                    drillDownAriaLabel
                                      ? drillDownAriaLabel(option.label)
                                      : `View ${option.label}`
                                  }
                                  onClick={() => handleCascadeDrillDown(category.id, option)}>
                                  <MdChevronRight size={20} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {category.options && (
                    <div className={styles.list}>
                      {category.options.map((option) => {
                        const value = typeof option === "string" ? option : option.value;
                        const label = typeof option === "string" ? option : option.label;
                        const isChecked = currentSelected.includes(value);

                        return (
                          <div key={value} className={styles.listItem}>
                            <Checkbox
                              className={styles.checkboxFull}
                              label={label}
                              checked={isChecked}
                              onChange={() => toggleCategoryOption(category.id, value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Drawer.Body>

      <Drawer.Footer>
        <Button variant="outline" color="neutral" size="md" fullWidth onClick={handleClearAll}>
          {clearLabel}
        </Button>
        <Button variant="solid" color="primary" size="md" fullWidth onClick={handleApply}>
          {totalActiveCount > 0 ? `${applyLabel} (${totalActiveCount})` : applyLabel}
        </Button>
      </Drawer.Footer>
    </>
  );
}

export function TableFiltersDrawer(props: TableFiltersDrawerProps) {
  if (!props.isOpen) return null;

  return (
    <Drawer open={props.isOpen} onClose={props.onClose} position="right" size="md">
      <TableFiltersDrawerContent {...props} />
    </Drawer>
  );
}

export const MobileFiltersDrawer = TableFiltersDrawer;
