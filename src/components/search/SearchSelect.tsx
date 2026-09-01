"use client";

import { useState, useRef, useEffect, useCallback, useId, ReactNode, KeyboardEvent } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaCheck } from "react-icons/fa6";
import { useSearch, SearchField } from "@/hooks/useSearch";
import styles from "@/styles/components/search/SearchSelect.module.css";

export interface SearchSelectProps<T> {
  items: T[];
  selectedItem?: T | null;
  selectedItems?: T[];
  onSelect?: (_item: T) => void;
  onChange?: (_items: T[]) => void;
  multiSelect?: boolean;
  fields?: SearchField<T>[];
  getItemKey?: (_item: T) => string;
  getItemLabel?: (_item: T) => string;
  renderItem?: (_item: T, _isSelected: boolean) => ReactNode;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  emptyMessage?: string;
  noItemsMessage?: string;
}

export default function SearchSelect<T>({
  items,
  selectedItem,
  selectedItems = [],
  onSelect,
  onChange,
  multiSelect = false,
  fields,
  getItemKey,
  getItemLabel,
  renderItem,
  placeholder = "Pesquisar...",
  label,
  disabled = false,
  id,
  className,
  emptyMessage = "Nenhum resultado encontrado",
  noItemsMessage = "Nenhum item selecionado",
}: SearchSelectProps<T>) {
  const uId = useId();
  const triggerId = id ?? `search-select-trigger-${uId}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefsRef = useRef<Array<HTMLDivElement | null>>([]);

  const { results, query, setQuery } = useSearch<T>({
    data: items,
    fields: fields ?? (["name", "title", "id", "self"] as SearchField<T>[]),
    returnAllWhenEmpty: true,
  });

  const defaultGetKey = useCallback(
    (item: T): string => {
      if (getItemKey) return getItemKey(item);
      if (typeof item === "object" && item !== null) {
        const rec = item as Record<string, unknown>;
        return String(rec.id ?? rec.key ?? rec.istid ?? rec.name ?? JSON.stringify(item));
      }
      return String(item);
    },
    [getItemKey]
  );

  const defaultGetLabel = useCallback(
    (item: T): string => {
      if (getItemLabel) return getItemLabel(item);
      if (typeof item === "object" && item !== null) {
        const rec = item as Record<string, unknown>;
        return String(rec.name ?? rec.label ?? rec.title ?? rec.id ?? "");
      }
      return String(item);
    },
    [getItemLabel]
  );

  const isItemChecked = useCallback(
    (item: T): boolean => {
      const key = defaultGetKey(item);
      if (multiSelect) return selectedItems.some((sel) => defaultGetKey(sel) === key);

      return selectedItem ? defaultGetKey(selectedItem) === key : false;
    },
    [defaultGetKey, multiSelect, selectedItem, selectedItems]
  );

  const openDropdown = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    setActiveIndex(0);
    triggerRef.current?.focus();
  };

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, [setQuery]);

  const selectItem = (item: T) => {
    if (multiSelect) {
      const key = defaultGetKey(item);
      const exists = selectedItems.some((sel) => defaultGetKey(sel) === key);
      const updated = exists
        ? selectedItems.filter((sel) => defaultGetKey(sel) !== key)
        : [...selectedItems, item];
      onChange?.(updated);
    } else {
      onSelect?.(item);
      closeDropdown();
    }
    triggerRef.current?.focus();
  };

  const removeItem = (item: T) => {
    const key = defaultGetKey(item);
    onChange?.(selectedItems.filter((sel) => defaultGetKey(sel) !== key));
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, closeDropdown]);

  useEffect(() => {
    setActiveIndex(0);
    itemRefsRef.current = [];
  }, [open, results.length]);

  useEffect(() => {
    if (activeIndex >= 0 && itemRefsRef.current[activeIndex])
      itemRefsRef.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openDropdown();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
      return;
    }

    if (e.key === "Escape") {
      closeDropdown();
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && results[activeIndex]) selectItem(results[activeIndex]);
    }
  };

  const inputValue = open
    ? query
    : multiSelect
      ? ""
      : selectedItem
        ? defaultGetLabel(selectedItem)
        : "";

  return (
    <div className={`${styles.root} ${className || ""}`.trim()}>
      {label && (
        <label htmlFor={triggerId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.triggerWrap}>
        <input
          ref={triggerRef}
          id={triggerId}
          type="text"
          disabled={disabled}
          className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
          value={inputValue}
          placeholder={open ? "Escreva para pesquisar..." : placeholder}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(e) => {
            if (!open) setOpen(true);
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
        />
        <button
          type="button"
          className={styles.chevronButton}
          onClick={() => {
            if (open) closeDropdown();
            else openDropdown();
          }}
          disabled={disabled}
          aria-label="Alternar menu">
          <FiChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
        </button>
      </div>

      {open && (
        <div ref={dropdownRef} className={styles.dropdown} role="listbox">
          <div className={styles.optionList}>
            {results.length === 0 ? (
              <div className={styles.empty}>{emptyMessage}</div>
            ) : (
              results.map((item, i) => {
                const key = defaultGetKey(item);
                const labelText = defaultGetLabel(item);
                const isSelected = isItemChecked(item);
                const optionClassName = [
                  styles.option,
                  i === activeIndex ? styles.optionActive : "",
                  isSelected ? styles.optionSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={key}
                    ref={(el) => {
                      itemRefsRef.current[i] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={optionClassName}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectItem(item);
                    }}>
                    <span className={styles.optionIcon}>{isSelected ? <FaCheck /> : null}</span>
                    <span>{renderItem ? renderItem(item, isSelected) : labelText}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {multiSelect && (
        <div className={styles.badges}>
          {selectedItems.length === 0 ? (
            <span className={styles.noItems}>{noItemsMessage}</span>
          ) : (
            selectedItems.map((item) => {
              const key = defaultGetKey(item);
              const labelText = defaultGetLabel(item);
              return (
                <span key={key} className={styles.badge}>
                  {labelText}
                  <button
                    type="button"
                    aria-label={`Remover ${labelText}`}
                    className={styles.badgeRemove}
                    onClick={() => removeItem(item)}>
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
