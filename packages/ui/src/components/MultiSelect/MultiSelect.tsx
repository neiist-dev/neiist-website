"use client";

import { useState, useEffect, useRef, useMemo, KeyboardEvent, useId } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./MultiSelect.module.css";
import { FaCheck } from "react-icons/fa6";
import { Badge } from "../Badge/Badge";
import { Popover } from "../Popover/Popover";
import { SearchInput } from "../SearchInput/SearchInput";

export interface MultiSelectProps {
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
  selectLabel?: string;
  searchPlaceholder?: string;
  clearSearchLabel?: string;
  noItemsLabel?: string;
  createLabel?: string;
  noSelectionLabel?: string;
  mobileDrawerTitle?: string;
}

const CREATE_PREFIX = "__create__::";

function isCreate(opt: string) {
  return opt.startsWith(CREATE_PREFIX);
}

function getCreateName(opt: string) {
  return opt.replace(CREATE_PREFIX, "");
}

export function MultiSelect({
  availableItems,
  selectedItems,
  onChange,
  multiSelect = true,
  onItemCreate,
  placeholder,
  label,
  fuseThreshold: _fuseThreshold = 0.3,
  disabled = false,
  id,
  selectLabel,
  searchPlaceholder,
  clearSearchLabel,
  noItemsLabel,
  createLabel,
  noSelectionLabel,
  mobileDrawerTitle,
}: MultiSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `input-form-trigger-${generatedId}`;
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
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const exists = q ? knownItems.some((item) => item.toLowerCase() === q) : false;
    const results = q
      ? knownItems.filter((item) => item.toLowerCase().includes(q))
      : [...knownItems];
    return canCreate && q && !exists ? [...results, `${CREATE_PREFIX}${q}`] : results;
  }, [query, knownItems, canCreate]);

  useEffect(() => {
    setActiveIndex(0);
    itemsRef.current = [];
  }, [open, query, options.length]);

  useEffect(() => {
    itemsRef.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerWrapRef.current &&
        !triggerWrapRef.current.contains(event.target as Node)
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
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function selectItem(item: string) {
    if (multiSelect) {
      if (selectedItems.includes(item)) {
        onChange(selectedItems.filter((existingItem) => existingItem !== item));
      } else {
        onChange([...selectedItems, item]);
      }
    } else {
      onChange([item]);
      close();
    }
  }

  function createAndSelect(name: string) {
    if (!canCreate) return;
    const item = name.trim();
    if (!item) return;

    const isNew = !knownItems.some((x) => x.toLowerCase() === item.toLowerCase());
    if (isNew) {
      setKnownItems((prev) => [...prev, item].sort((a, b) => a.localeCompare(b)));
      onItemCreate?.(item);
    }

    if (multiSelect) {
      if (!selectedItems.includes(item)) {
        onChange([...selectedItems, item]);
      }
      setQuery("");
    } else {
      onChange([item]);
      close();
    }
  }

  const removeSelected = (val: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    onChange(selectedItems.filter((item) => item !== val));
  };

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();

    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (event.key === "Escape") {
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
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

      <div className={styles.triggerWrap} ref={triggerWrapRef}>
        <input
          ref={triggerRef}
          id={triggerId}
          type="text"
          disabled={disabled}
          className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
          value={open ? query : multiSelect ? "" : (selectedItems[0] ?? "")}
          placeholder={open ? searchPlaceholder : placeholder}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(event) => {
            if (!open) setOpen(true);
            setQuery(event.target.value);
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

      <Popover
        isOpen={open}
        onClose={close}
        anchorRef={triggerWrapRef}
        matchAnchorWidth
        mobileDrawerTitle={
          mobileDrawerTitle ??
          label ??
          selectLabel ??
          (multiSelect ? "Select items" : "Select an option")
        }>
        <div className={styles.optionList}>
          <div className={styles.mobileSearchContainer}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={searchPlaceholder ?? placeholder ?? "Search..."}
              clearLabel={clearSearchLabel}
              autoFocus
            />
          </div>
          {options.length === 0 && <div className={styles.empty}>{noItemsLabel}</div>}
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
                  itemsRef.current[i] = el;
                }}
                className={optionClassName}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleOptionClick(opt);
                }}>
                <span className={styles.optionIcon}>
                  {isSelected ? <FaCheck /> : isCreateOpt ? "+" : null}
                </span>
                <span>
                  {isCreateOpt
                    ? createLabel
                      ? `${createLabel} "${getCreateName(opt)}"`
                      : `"${getCreateName(opt)}"`
                    : opt}
                </span>
              </div>
            );
          })}
        </div>
      </Popover>

      {multiSelect ? (
        <div className={styles.badges}>
          {selectedItems.length === 0 ? (
            <span className={styles.noItems}>{noSelectionLabel}</span>
          ) : (
            selectedItems.map((item) => (
              <Badge
                key={item}
                variant="outline"
                removable
                onRemove={(event) => removeSelected(item, event)}>
                {item}
              </Badge>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
