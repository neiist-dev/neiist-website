"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/components/shop/OrdersFilters.module.css";
import { FiChevronDown } from "react-icons/fi";

interface FilterDropdownProps {
  onClose: () => void;
  onApplyFilters: (_filters: FilterState) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  availableProducts: string[];
  availableCampuses: string[];
  availableStatuses: { value: string; label: string }[];
}

export interface FilterState {
  dateStart: string;
  dateEnd: string;
  products: string[];
  campus: string;
  status: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  onClose,
  onApplyFilters,
  buttonRef,
  availableProducts,
  availableCampuses,
  availableStatuses,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);

  const [selectedCampus, setSelectedCampus] = useState("");
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const campusDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [buttonRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onClose();
      }

      // Close individual dropdowns when clicking outside
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(e.target as Node)) {
        setShowProductsDropdown(false);
      }
      if (campusDropdownRef.current && !campusDropdownRef.current.contains(e.target as Node)) {
        setShowCampusDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
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
  }, [onClose, buttonRef]);

  const handleApply = () => {
    const filters: FilterState = {
      dateStart,
      dateEnd,
      products: selectedProducts,
      campus: selectedCampus,
      status: selectedStatus,
    };
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setDateStart("");
    setDateEnd("");
    setSelectedProducts([]);
    setSelectedCampus("");
    setSelectedStatus("");
  };

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product) ? prev.filter((p) => p !== product) : [...prev, product]
    );
  };

  const getProductsDisplayText = () => {
    if (selectedProducts.length === 0) return "Select products";
    if (selectedProducts.length === 1) return selectedProducts[0];
    return `${selectedProducts.length} products selected`;
  };

  const getStatusLabel = (value: string) => {
    const status = availableStatuses.find((s) => s.value === value);
    return status ? status.label : value;
  };

  return (
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}>
      <div className={styles.header}>
        <button onClick={handleClear} className={styles.clearButton}>
          Clear
        </button>
        <h3>Filters</h3>
        <button onClick={handleApply} className={styles.doneButton}>
          Done
        </button>
      </div>

      <div className={styles.filterItem}>
        <div className={styles.filterLabel}>Date Range</div>
        <div className={styles.dateRangeInputs}>
          <div className={styles.dateInputWrapper}>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className={styles.dateInput}
              placeholder="dd-mm-yyyy"
            />
          </div>
          <span className={styles.dateTo}>to</span>
          <div className={styles.dateInputWrapper}>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className={styles.dateInput}
              placeholder="dd-mm-yyyy"
            />
          </div>
        </div>
      </div>

      <div className={styles.filterItem}>
        <div className={styles.filterLabel}>Products</div>
        <div className={styles.selectWrapper} ref={productsDropdownRef}>
          <button
            className={styles.selectButton}
            onClick={() => setShowProductsDropdown(!showProductsDropdown)}>
            {getProductsDisplayText()}
            <FiChevronDown size={16} />
          </button>
          {showProductsDropdown && (
            <div className={styles.selectDropdown}>
              {availableProducts.map((product) => (
                <label key={product} className={styles.dropdownOption}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product)}
                    onChange={() => toggleProduct(product)}
                    className={styles.checkbox}
                  />
                  <span>{product}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterItem}>
        <div className={styles.filterLabel}>Campus</div>
        <div className={styles.selectWrapper} ref={campusDropdownRef}>
          <button
            className={styles.selectButton}
            onClick={() => setShowCampusDropdown(!showCampusDropdown)}>
            {selectedCampus || "Select campus"}
            <FiChevronDown size={16} />
          </button>
          {showCampusDropdown && (
            <div className={styles.selectDropdown}>
              {availableCampuses.map((campus) => (
                <div
                  key={campus}
                  className={styles.dropdownOption}
                  onClick={() => {
                    setSelectedCampus(campus);
                    setShowCampusDropdown(false);
                  }}>
                  <span>{campus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterItem}>
        <div className={styles.filterLabel}>Order Status</div>
        <div className={styles.selectWrapper} ref={statusDropdownRef}>
          <button
            className={styles.selectButton}
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}>
            {selectedStatus ? getStatusLabel(selectedStatus) : "Select order status"}
            <FiChevronDown size={16} />
          </button>
          {showStatusDropdown && (
            <div className={styles.selectDropdown}>
              {availableStatuses.map((status) => (
                <div
                  key={status.value}
                  className={styles.dropdownOption}
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setShowStatusDropdown(false);
                  }}>
                  <span>{status.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterDropdown;
