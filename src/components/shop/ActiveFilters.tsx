"use client";

import styles from "@/styles/components/shop/ActiveFilters.module.css";
import { FiX } from "react-icons/fi";
import { OrderStatus } from "@/types/shop";

interface ActiveFiltersProps {
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  campuses: string[];
  statuses: string[];
  onRemoveDateRange: () => void;
  onRemoveProduct: (_product: string) => void;
  onRemoveCampus: (_campus: string) => void;
  onRemoveStatus: (_status: string) => void;
  onClearAll: () => void;
  getStatusLabel: (_status: OrderStatus) => string;
  dict: {
    label: string;
    clear_all: string;
    from: string;
    until: string;
    remove_date_range: string;
    remove_filter: string;
  };
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
  products,
  campuses,
  statuses,
  onRemoveDateRange,
  onRemoveProduct,
  onRemoveCampus,
  onRemoveStatus,
  onClearAll,
  getStatusLabel,
  dict,
  locale,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    !!(dateRange.start || dateRange.end) ||
    products.length > 0 ||
    campuses.length > 0 ||
    statuses.length > 0;

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

        {products.map((product) => (
          <span key={product} className={styles.tag}>
            {product}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemoveProduct(product)}
              aria-label={`${dict.remove_filter} ${product}`}>
              <FiX size={14} />
            </button>
          </span>
        ))}

        {campuses.map((campus) => (
          <span key={campus} className={styles.tag}>
            {campus}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemoveCampus(campus)}
              aria-label={`${dict.remove_filter} ${campus}`}>
              <FiX size={14} />
            </button>
          </span>
        ))}

        {statuses.map((status) => (
          <span key={status} className={styles.tag}>
            {getStatusLabel(status as OrderStatus)}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemoveStatus(status)}
              aria-label={`${dict.remove_filter} ${status}`}>
              <FiX size={14} />
            </button>
          </span>
        ))}

        <button type="button" className={styles.clearBtn} onClick={onClearAll}>
          {dict.clear_all}
        </button>
      </div>
    </div>
  );
}
