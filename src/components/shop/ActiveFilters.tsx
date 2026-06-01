"use client";

import styles from "@/styles/components/shop/ActiveFilters.module.css";
import { FiX } from "react-icons/fi";
import type { ActiveFiltersDict } from "@/types/i18n";

export interface FilterGroup {
  id: string;
  label: string;
  values: string[];
  getDisplayValue?: (_value: string) => string;
}

interface ActiveFiltersProps {
  dateRange: { start: Date | null; end: Date | null };
  onRemoveDateRange: () => void;
  filterGroups: FilterGroup[];
  onRemoveValue: (_groupId: string, _value: string) => void;
  onClearAll: () => void;
  dict: ActiveFiltersDict;
  locale: string;
}

function formatDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateRange(start: Date | null, end: Date | null, from: string, until: string, locale: string): string {
  if (start && end) return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
  if (start) return `${from} ${formatDate(start, locale)}`;
  if (end) return `${until} ${formatDate(end, locale)}`;
  return "";
}

export default function ActiveFilters({
  dateRange,
  onRemoveDateRange,
  filterGroups,
  onRemoveValue,
  onClearAll,
  dict,
  locale,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    !!(dateRange.start || dateRange.end) || filterGroups.some((g) => g.values.length > 0);

  if (!hasActiveFilters) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>{dict.label}</span>
      <div className={styles.tags}>
        {(dateRange.start || dateRange.end) && (
          <span className={styles.tag}>
            {formatDateRange(dateRange.start, dateRange.end, dict.from, dict.until, locale)}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={onRemoveDateRange}
              aria-label={dict.remove_date_range}>
              <FiX size={14} />
            </button>
          </span>
        )}

        {filterGroups.map((group) =>
          group.values.map((value) => (
            <span key={`${group.id}-${value}`} className={styles.tag}>
              {group.getDisplayValue ? group.getDisplayValue(value) : value}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => onRemoveValue(group.id, value)}
                aria-label={`${dict.remove_filter} ${value}`}>
                <FiX size={14} />
              </button>
            </span>
          ))
        )}

        <button type="button" className={styles.clearBtn} onClick={onClearAll}>
          {dict.clear_all}
        </button>
      </div>
    </div>
  );
}