"use client";

import React from "react";
import { FiChevronDown, FiFilter, FiTrash2, FiX } from "react-icons/fi";
import styles from "./TableToolbar.module.css";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { DropdownMenu } from "../DropdownMenu/DropdownMenu";
import { cn } from "../../utils/cn";

export interface FilterGroup {
  id: string;
  label: string;
  values: string[];
  getDisplayValue?: (_value: string) => string;
}

export interface CustomTag {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface TableToolbarDateFilter {
  start: Date | null;
  end: Date | null;
  onRemove?: () => void;
  fromPrefix: string;
  untilPrefix: string;
  locale: string;
}

export interface TableToolbarFiltersProps {
  dateFilter?: TableToolbarDateFilter;
  filterGroups?: FilterGroup[];
  onRemoveValue?: (_groupId: string, _value: string) => void;
  customTags?: CustomTag[];
  onClearAll: () => void;
  label: string;
  clearLabel: string;
  collapsedLabel: (_count: number) => string;
  maxVisible?: number;
}

export interface TableToolbarSelectionProps {
  count: number;
  label: React.ReactNode;
  onClear: () => void;
  clearLabel: string;
  actions?: React.ReactNode;
}

export interface TableToolbarProps {
  filters?: TableToolbarFiltersProps;
  selection?: TableToolbarSelectionProps;
  ariaLabel?: string;
  className?: string;
}

interface ResolvedFilterItem {
  id: string;
  label: string;
  onRemove?: () => void;
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange({
  start,
  end,
  fromPrefix,
  untilPrefix,
  locale,
}: TableToolbarDateFilter): string {
  if (start && end) return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
  if (start) return `${fromPrefix} ${formatDate(start, locale)}`;
  if (end) return `${untilPrefix} ${formatDate(end, locale)}`;
  return "";
}

export function TableToolbar({ filters, selection, ariaLabel, className }: TableToolbarProps) {
  const filterItems: ResolvedFilterItem[] = [];

  if (filters) {
    const { dateFilter, filterGroups = [], onRemoveValue, customTags = [] } = filters;

    if (dateFilter && (dateFilter.start || dateFilter.end)) {
      filterItems.push({
        id: "__dateRange__",
        label: formatDateRange(dateFilter),
        onRemove: dateFilter.onRemove,
      });
    }

    for (const group of filterGroups) {
      for (const value of group.values) {
        filterItems.push({
          id: `${group.id}-${value}`,
          label: group.getDisplayValue ? group.getDisplayValue(value) : value,
          onRemove: onRemoveValue ? () => onRemoveValue(group.id, value) : undefined,
        });
      }
    }

    for (const tag of customTags) {
      filterItems.push({
        id: `custom-${tag.id}`,
        label: tag.label,
        onRemove: tag.onRemove,
      });
    }
  }

  const hasFilters = filterItems.length > 0;
  const hasSelection = Boolean(selection && selection.count > 0);

  if (!hasFilters && !hasSelection) return null;

  const maxVisible = filters?.maxVisible ?? 2;
  const isFiltersCollapsed = filterItems.length > maxVisible;

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className={cn(styles.toolbar, hasSelection && styles.toolbarSelected, className)}>
      <div className={styles.group}>
        {hasSelection && selection && (
          <div className={styles.selection}>
            <span className={styles.count}>
              <Badge variant="outline" size="sm" className={cn(styles.pill, styles.countBadge)}>
                {selection.count}
              </Badge>
              {selection.label}
            </span>
            <Button
              type="button"
              variant="outline"
              color="neutral"
              size="sm"
              onClick={selection.onClear}>
              {selection.clearLabel}
            </Button>
          </div>
        )}

        {hasSelection && hasFilters && <span className={styles.divider} aria-hidden="true" />}

        {hasFilters && filters && (
          <div className={styles.filters}>
            {!hasSelection && <span className={styles.filtersLabel}>{filters.label}</span>}

            {isFiltersCollapsed ? (
              <DropdownMenu align="start">
                <DropdownMenu.Trigger>
                  <Button type="button" variant="outline" color="primary" size="sm">
                    <FiFilter size={14} />
                    {filters.collapsedLabel(filterItems.length)}
                    <FiChevronDown size={14} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" width="auto" mobileTitle={filters.label}>
                  {filterItems.map((item) => (
                    <DropdownMenu.Item
                      key={item.id}
                      closeOnSelect={false}
                      disabled={!item.onRemove}
                      endIcon={item.onRemove ? <FiX size={14} /> : undefined}
                      onClick={() => item.onRemove?.()}>
                      {item.label}
                    </DropdownMenu.Item>
                  ))}
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    destructive
                    icon={<FiTrash2 size={14} />}
                    onClick={filters.onClearAll}>
                    {filters.clearLabel}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : (
              <>
                {filterItems.map((item) => (
                  <Badge
                    key={item.id}
                    variant="outline"
                    className={styles.pill}
                    removable={Boolean(item.onRemove)}
                    onRemove={item.onRemove}>
                    {item.label}
                  </Badge>
                ))}
                {!hasSelection && (
                  <Button
                    type="button"
                    variant="outline"
                    color="neutral"
                    size="sm"
                    onClick={filters.onClearAll}>
                    {filters.clearLabel}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {hasSelection && selection?.actions && (
        <div className={styles.actions}>{selection.actions}</div>
      )}
    </section>
  );
}
