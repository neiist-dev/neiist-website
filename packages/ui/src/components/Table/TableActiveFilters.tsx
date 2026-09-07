"use client";

import React from "react";
import styles from "./TableActiveFilters.module.css";
import { Button } from "../Button/Button";
import { Badge } from "../Badge/Badge";
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

export interface TableActiveFiltersProps {
  dateRange?: { start: Date | null; end: Date | null };
  onRemoveDateRange?: () => void;
  filterGroups?: FilterGroup[];
  onRemoveValue?: (_groupId: string, _value: string) => void;
  customTags?: CustomTag[];
  onClearAll?: () => void;
  label?: string;
  clearLabel?: string;
  untilPrefix?: string;
  fromPrefix?: string;
  locale?: string;
  className?: string;
}

function formatDate(date: Date | null, locale?: string): string {
  if (!date) return "";
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(
  start: Date | null,
  end: Date | null,
  fromPrefix: string,
  untilPrefix: string,
  locale?: string
): string {
  if (start && end) return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
  if (start) return `${fromPrefix} ${formatDate(start, locale)}`;
  if (end) return `${untilPrefix} ${formatDate(end, locale)}`;
  return "";
}

export function TableActiveFilters({
  dateRange,
  onRemoveDateRange,
  filterGroups = [],
  onRemoveValue,
  customTags = [],
  onClearAll,
  label = "Active Filters:",
  clearLabel = "Clear All",
  untilPrefix = "Until",
  fromPrefix = "From",
  locale,
  className,
}: TableActiveFiltersProps) {
  const hasDateFilter = Boolean(dateRange && (dateRange.start || dateRange.end));
  const hasGroupFilters = filterGroups.some((group) => group.values.length > 0);
  const hasCustomTags = customTags.length > 0;

  if (!hasDateFilter && !hasGroupFilters && !hasCustomTags) {
    return null;
  }

  return (
    <div className={cn(styles.container, className)}>
      <span className={styles.label}>{label}</span>
      <div className={styles.tags}>
        {hasDateFilter && dateRange && (
          <Badge
            variant="outline"
            className={styles.tag}
            removable={Boolean(onRemoveDateRange)}
            onRemove={onRemoveDateRange}>
            {formatDateRange(dateRange.start, dateRange.end, fromPrefix, untilPrefix, locale)}
          </Badge>
        )}

        {filterGroups.map((group) =>
          group.values.map((value) => (
            <Badge
              key={`${group.id}-${value}`}
              variant="outline"
              className={styles.tag}
              removable={Boolean(onRemoveValue)}
              onRemove={onRemoveValue ? () => onRemoveValue(group.id, value) : undefined}>
              {group.getDisplayValue ? group.getDisplayValue(value) : value}
            </Badge>
          ))
        )}

        {customTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className={styles.tag}
            removable
            onRemove={tag.onRemove}>
            {tag.label}
          </Badge>
        ))}

        {onClearAll && (
          <Button variant="outline" color="neutral" size="sm" onClick={onClearAll}>
            {clearLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
