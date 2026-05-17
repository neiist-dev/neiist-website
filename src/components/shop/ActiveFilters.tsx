"use client";

import styles from "@/styles/components/shop/ActiveFilters.module.css";
import { FiX } from "react-icons/fi";

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
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "";
}

export default function ActiveFilters({
  dateRange,
  onRemoveDateRange,
  filterGroups,
  onRemoveValue,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    !!(dateRange.start || dateRange.end) || filterGroups.some((g) => g.values.length > 0);

  if (!hasActiveFilters) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Active Filters:</span>
      <div className={styles.tags}>
        {(dateRange.start || dateRange.end) && (
          <span className={styles.tag}>
            {formatDateRange(dateRange.start, dateRange.end)}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={onRemoveDateRange}
              aria-label="remove date range">
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
                aria-label={`remove ${value}`}>
                <FiX size={14} />
              </button>
            </span>
          ))
        )}

        <button type="button" className={styles.clearBtn} onClick={onClearAll}>
          Clear All
        </button>
      </div>
    </div>
  );
}
