"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent, useId } from "react";
import Fuse from "fuse.js";
import { FiChevronDown } from "react-icons/fi";
import styles from "@/styles/components/MultiSelectDropdown.module.css";
import { FaCheck } from "react-icons/fa6";

export interface MultiSelectDropdownProps {
  availableItems: string[];
  selectedItems: string[];
  onChange: (_items: string[]) => void;
  multiSelect?: boolean;
  onItemCreate?: (_item: string) => void;
  placeholder?: string;
  label?: string;
  fuseThreshold?: number;
  disabled?: boolean;
  id?: string;
}

const CREATE_PREFIX = "__create__::";

function isCreate(opt: string) {
  return opt.startsWith(CREATE_PREFIX);
}

function getCreateName(opt: string) {
  return opt.replace(CREATE_PREFIX, "");
}

export default function MultiSelectDropdown({
  availableItems,
  selectedItems,
  onChange,
  multiSelect = true,
  onItemCreate,
  placeholder = "Add or create item...",
  label,
  fuseThreshold = 0.3,
  disabled = false,
  id,
}: MultiSelectDropdownProps) {
  const uid = useId();
  const triggerId = id ?? `input-form-trigger-${uid}`;
  const canCreate = typeof onItemCreate === "function";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [knownItems, setKnownItems] = useState<string[]>(availableItems);

  useEffect(() => {
    setKnownItems((prev) => {
      const merged = Array.from(new Set([...availableItems, ...prev]));
      return merged.sort((a, b) => a.localeCompare(b));
    });
  }, [availableItems]);

  const triggerRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const fuse = useMemo(
    () =>
      new Fuse(knownItems, {
        threshold: fuseThreshold,
        ignoreLocation: true,
      }),
    [knownItems, fuseThreshold]
  );

  const options = useMemo(() => {
    const q = query.trim();
    const exists = q ? knownItems.some((t) => t.toLowerCase() === q.toLowerCase()) : false;
    const results = q ? fuse.search(q).map((r) => r.item) : [...knownItems];
    return canCreate && q && !exists ? [...results, `${CREATE_PREFIX}${q}`] : results;
  }, [query, knownItems, fuse, canCreate]);

  useEffect(() => {
    setActiveIndex(0);
    itemRefs.current = [];
  }, [open, query, options.length]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function selectItem(item: string) {
    if (multiSelect) {
      if (selectedItems.includes(item)) {
        onChange(selectedItems.filter((t) => t !== item));
      } else {
        onChange([...selectedItems, item]);
      }
    } else {
      if (selectedItems[0] === item) {
        onChange([]);
      } else {
        onChange([item]);
      }
    }
    close();
    setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function createAndSelect(name: string) {
    if (!canCreate) return;
    const t = name.trim();
    if (!t) return;

    const isNew = !knownItems.some((x) => x.toLowerCase() === t.toLowerCase());
    if (isNew) {
      setKnownItems((prev) => [...prev, t].sort((a, b) => a.localeCompare(b)));
      onItemCreate?.(t);
    }

    if (multiSelect) {
      if (!selectedItems.includes(t)) {
        onChange([...selectedItems, t]);
      }
    } else {
      onChange([t]);
    }

    close();
    setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function removeItem(item: string) {
    if (multiSelect) {
      onChange(selectedItems.filter((t) => t !== item));
    } else if (selectedItems[0] === item) {
      onChange([]);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();

    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openDropdown();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Escape") {
      close();
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const sel = options[activeIndex] ?? options[0];
      if (!sel) {
        const q = query.trim();
        if (q && canCreate) createAndSelect(q);
        return;
      }
      if (isCreate(sel)) {
        createAndSelect(getCreateName(sel));
      } else {
        selectItem(sel);
      }
    }
  }

  function handleOptionClick(opt: string) {
    if (isCreate(opt)) {
      createAndSelect(getCreateName(opt));
    } else {
      selectItem(opt);
    }
  }

  return (
    <div className={styles.root}>
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
          value={open ? query : multiSelect ? "" : (selectedItems[0] ?? "")}
          placeholder={open ? "Type to search or create..." : placeholder}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(e) => {
            if (!open) setOpen(true);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.chevronButton}
          onClick={() => {
            if (open) close();
            else openDropdown();
          }}
          disabled={disabled}>
          <FiChevronDown className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
        </button>
      </div>

      {open && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <div className={styles.optionList}>
            {options.length === 0 && <div className={styles.empty}>No items found</div>}
            {options.map((opt, i) => {
              const isCreateOpt = isCreate(opt);
              const isSelected = !isCreateOpt && selectedItems.includes(opt);
              const optionClassName = [
                styles.option,
                i === activeIndex ? styles.optionActive : "",
                isSelected ? styles.optionSelected : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={opt}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className={optionClassName}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleOptionClick(opt);
                  }}>
                  <span className={styles.optionIcon}>
                    {isSelected ? <FaCheck /> : isCreateOpt ? "+" : null}
                  </span>
                  <span>{isCreateOpt ? `Create "${getCreateName(opt)}"` : opt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {multiSelect ? (
        <div className={styles.badges}>
          {selectedItems.length === 0 ? (
            <span className={styles.noItems}>No item selected</span>
          ) : (
            selectedItems.map((item) => (
              <span key={item} className={styles.badge}>
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  className={styles.badgeRemove}
                  onClick={() => removeItem(item)}>
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
