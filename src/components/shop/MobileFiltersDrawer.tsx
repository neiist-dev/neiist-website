"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/components/shop/MobileFiltersDrawer.module.css";
import { FiCheck, FiX } from "react-icons/fi";
import { OrderStatus } from "@/types/shop";

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  products: string[];
  campuses: string[];
  statuses: string[];
}

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (_filters: FilterState) => void;
  availableProducts: string[];
  availableCampuses: string[];
  availableStatuses: string[];
  getStatusLabel: (_status: OrderStatus) => string;
}

function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const leadingBlanks = (firstWeekday + 6) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    days.push(null);
  }
  for (let day = 1; day <= lastDate; day++) {
    days.push(new Date(year, month, day));
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

export default function MobileFiltersDrawer({
  isOpen,
  onClose,
  filters: initialFilters,
  onApplyFilters,
  availableProducts,
  availableCampuses,
  availableStatuses,
  getStatusLabel,
}: MobileFiltersDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [dateMode, setDateMode] = useState<"until" | "range">("until");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedSection, setExpandedSection] = useState<string | null>("date");

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleItem = (key: keyof FilterState, item: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleArrayItem(prev[key] as string[], item),
    }));
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
    setFilters({
      dateRange: { start: null, end: null },
      products: [],
      campuses: [],
      statuses: [],
    });
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
    filters.products.length +
    filters.campuses.length +
    filters.statuses.length;

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
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                  <div key={i} className={styles.dayName}>
                    {day}
                  </div>
                ))}

                {days.map((date, i) => {
                  if (!date) {
                    return <button key={i} type="button" className={styles.day} disabled />;
                  }

                  const { start, end } = filters.dateRange;
                  const isSelected =
                    (start && isSameDay(date, start)) || (end && isSameDay(date, end));
                  const isInRange = start && end && isDateInRange(date, start, end);

                  return (
                    <button
                      key={i}
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

          <FilterSection
            title="Produtos"
            badge={filters.products.length}
            expanded={expandedSection === "products"}
            onToggle={() => toggleSection("products")}>
            <div className={styles.list}>
              {availableProducts.map((product) => (
                <CheckboxItem
                  key={product}
                  label={product}
                  checked={filters.products.includes(product)}
                  onToggle={() => toggleItem("products", product)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Campus"
            badge={filters.campuses.length}
            expanded={expandedSection === "campus"}
            onToggle={() => toggleSection("campus")}>
            <div className={styles.list}>
              {availableCampuses.map((campus) => (
                <CheckboxItem
                  key={campus}
                  label={campus}
                  checked={filters.campuses.includes(campus)}
                  onToggle={() => toggleItem("campuses", campus)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Estado"
            badge={filters.statuses.length}
            expanded={expandedSection === "status"}
            onToggle={() => toggleSection("status")}>
            <div className={styles.list}>
              {availableStatuses.map((status) => (
                <CheckboxItem
                  key={status}
                  label={getStatusLabel(status as OrderStatus)}
                  checked={filters.statuses.includes(status)}
                  onToggle={() => toggleItem("statuses", status)}
                />
              ))}
            </div>
          </FilterSection>
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
