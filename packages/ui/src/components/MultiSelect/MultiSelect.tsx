"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  KeyboardEvent,
  useId,
  ReactNode,
} from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./MultiSelect.module.css";
import { FaCheck } from "react-icons/fa6";
import { Badge } from "../Badge/Badge";
import { Avatar } from "../Avatar/Avatar";
import { Popover } from "../Popover/Popover";
import { SearchInput } from "../SearchInput/SearchInput";

export interface MultiSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  avatar?: string;
  [key: string]: unknown;
}

export type MultiSelectItem = string | MultiSelectOption;

export interface MultiSelectProps<T = MultiSelectItem> {
  availableItems?: T[];
  items?: T[];
  selectedItems?: (string | T)[];
  selectedItem?: string | T | null;
  onChange?: (_items: string[]) => void;
  onSelect?: (_item: T) => void;
  multiSelect?: boolean;
  onItemCreate?: (_item: string) => void;
  onSearch?: (_query: string, _signal: AbortSignal) => Promise<T[]>;
  renderItem?: (_item: T, _isSelected: boolean) => ReactNode;
  getItemKey?: (_item: T) => string;
  getItemLabel?: (_item: T) => string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
  selectLabel?: string;
  searchPlaceholder?: string;
  clearSearchLabel?: string;
  noItemsLabel?: string;
  emptyMessage?: string;
  createLabel?: string;
  noSelectionLabel?: string;
  mobileDrawerTitle?: string;
  className?: string;
}

function isOptionObject(item: unknown): item is MultiSelectOption {
  return typeof item === "object" && item !== null;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function MultiSelect<T = MultiSelectItem>({
  availableItems,
  items,
  selectedItems = [],
  selectedItem,
  onChange,
  onSelect,
  multiSelect = true,
  onItemCreate,
  onSearch,
  renderItem,
  getItemKey,
  getItemLabel,
  placeholder = "Select...",
  label,
  disabled = false,
  id,
  selectLabel,
  searchPlaceholder,
  clearSearchLabel,
  noItemsLabel,
  emptyMessage,
  createLabel,
  noSelectionLabel,
  mobileDrawerTitle,
  className,
}: MultiSelectProps<T>) {
  const initialItems = useMemo(() => items ?? availableItems ?? [], [items, availableItems]);
  const generatedId = useId();
  const triggerId = id ?? `input-form-trigger-${generatedId}`;
  const canCreate = typeof onItemCreate === "function";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [createdItems, setCreatedItems] = useState<T[]>([]);
  const [asyncResults, setAsyncResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getKey = useCallback(
    (item: T): string => {
      if (getItemKey) return getItemKey(item);
      if (isOptionObject(item)) {
        const rec = item as Record<string, unknown>;
        return String(
          rec.value ?? rec.id ?? rec.key ?? rec.name ?? rec.label ?? JSON.stringify(item)
        );
      }
      return String(item);
    },
    [getItemKey]
  );

  const getLabel = useCallback(
    (item: T): string => {
      if (getItemLabel) return getItemLabel(item);
      if (isOptionObject(item)) {
        const rec = item as Record<string, unknown>;
        return String(rec.label ?? rec.name ?? rec.title ?? rec.value ?? rec.id ?? "");
      }
      return String(item);
    },
    [getItemLabel]
  );

  const allItems = useMemo(() => [...initialItems, ...createdItems], [initialItems, createdItems]);

  const triggerRef = useRef<HTMLInputElement>(null);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Async remote search effect
  useEffect(() => {
    if (!onSearch || !open) return;
    const controller = new AbortController();
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await onSearch(query, controller.signal);
        if (!controller.signal.aborted) {
          setAsyncResults(res);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("MultiSelect onSearch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, onSearch, open]);

  // Options filtering
  const options = useMemo(() => {
    const list = onSearch ? asyncResults : allItems;
    const q = normalize(query.trim());
    if (!q) return list;

    const tokens = q.split(/\s+/).filter(Boolean);
    return list.filter((item) => {
      const l = normalize(getLabel(item));
      const sub = isOptionObject(item) && item.subtitle ? normalize(String(item.subtitle)) : "";
      return tokens.every((token) => l.includes(token) || sub.includes(token));
    });
  }, [onSearch, asyncResults, query, allItems, getLabel]);

  const trimmedQuery = query.trim();
  const showCreateOption = Boolean(
    canCreate &&
    trimmedQuery &&
    !(onSearch ? asyncResults : allItems).some(
      (item) => normalize(getLabel(item)) === normalize(trimmedQuery)
    )
  );

  const totalOptionsCount = options.length + (showCreateOption ? 1 : 0);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, totalOptionsCount - 1));

  useEffect(() => {
    itemsRef.current[safeActiveIndex]?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(0);
  };

  const selectedKeys = useMemo(() => {
    if (!multiSelect && selectedItem !== undefined) {
      if (!selectedItem) return [];
      return [typeof selectedItem === "string" ? selectedItem : getKey(selectedItem)];
    }
    return selectedItems.map((sel) => (typeof sel === "string" ? sel : getKey(sel)));
  }, [multiSelect, selectedItem, selectedItems, getKey]);

  const selectItem = (item: T) => {
    const key = getKey(item);
    if (multiSelect) {
      const isSel = selectedKeys.includes(key);
      const updated = isSel ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key];
      onChange?.(updated);
    } else {
      onSelect?.(item);
      onChange?.([key]);
      close();
    }
  };

  const createAndSelect = (name: string) => {
    if (!canCreate) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    onItemCreate?.(trimmed);
    setCreatedItems((prev) => (prev.includes(trimmed as T) ? prev : [...prev, trimmed as T]));
    if (multiSelect) {
      if (!selectedKeys.includes(trimmed)) {
        onChange?.([...selectedKeys, trimmed]);
      }
      setQuery("");
      setActiveIndex(0);
    } else {
      close();
    }
  };

  const removeSelected = (key: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    onChange?.(selectedKeys.filter((k) => k !== key));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openDropdown();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (totalOptionsCount > 0 ? (i + 1) % totalOptionsCount : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) =>
        totalOptionsCount > 0 ? (i - 1 + totalOptionsCount) % totalOptionsCount : 0
      );
      return;
    }

    if (event.key === "Escape") {
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (showCreateOption && safeActiveIndex === options.length) {
        createAndSelect(trimmedQuery);
      } else if (options[safeActiveIndex]) {
        selectItem(options[safeActiveIndex]);
      } else if (showCreateOption) {
        createAndSelect(trimmedQuery);
      }
    }
  };

  const singleSelectedLabel = useMemo(() => {
    if (multiSelect) return "";
    if (selectedItem) return getLabel(selectedItem as T);
    if (selectedItems.length > 0) {
      const first = selectedItems[0];
      if (typeof first === "string") {
        const found = allItems.find((it) => getKey(it) === first);
        return found ? getLabel(found) : first;
      }
      return getLabel(first as T);
    }
    return "";
  }, [multiSelect, selectedItem, selectedItems, allItems, getLabel, getKey]);

  const inputValue = open ? query : singleSelectedLabel;

  return (
    <div className={`${styles.root} ${className || ""}`.trim()}>
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
          value={inputValue}
          placeholder={open ? (searchPlaceholder ?? "Type to search...") : placeholder}
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(event) => {
            if (!open) setOpen(true);
            setActiveIndex(0);
            setQuery(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.chevronButton}
          onClick={() => {
            if (open) close();
            else openDropdown();
          }}
          disabled={disabled}
          aria-label="Toggle options">
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
              onChange={(val) => {
                setActiveIndex(0);
                setQuery(val);
              }}
              placeholder={searchPlaceholder ?? placeholder ?? "Search..."}
              clearLabel={clearSearchLabel}
              autoFocus
            />
          </div>

          {options.length === 0 && !showCreateOption && (
            <div className={styles.empty}>
              {isSearching ? (
                <span>Searching...</span>
              ) : (
                (noItemsLabel ?? emptyMessage ?? "No items found")
              )}
            </div>
          )}

          {options.map((opt, i) => {
            const key = getKey(opt);
            const isSelected = selectedKeys.includes(key);
            const optionClassName = [
              styles.option,
              i === safeActiveIndex ? styles.optionActive : "",
              isSelected ? styles.optionSelected : "",
            ]
              .filter(Boolean)
              .join(" ");

            const labelText = getLabel(opt);
            const subtitleText =
              isOptionObject(opt) && opt.subtitle ? String(opt.subtitle) : undefined;
            const avatarSrc = isOptionObject(opt) && opt.avatar ? String(opt.avatar) : undefined;

            return (
              <div
                key={key}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
                className={optionClassName}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  selectItem(opt);
                }}>
                {renderItem ? (
                  renderItem(opt, isSelected)
                ) : (
                  <div className={styles.optionContent}>
                    {avatarSrc ? (
                      <Avatar
                        size="sm"
                        fallback={labelText.slice(0, 1).toUpperCase()}
                        image={
                          <img src={avatarSrc} alt={labelText} className={styles.optionAvatarImg} />
                        }
                      />
                    ) : null}
                    <div className={styles.optionTextWrap}>
                      <span className={styles.optionLabel}>{labelText}</span>
                      {subtitleText && (
                        <span className={styles.optionSubtitle}>{subtitleText}</span>
                      )}
                    </div>
                  </div>
                )}
                <span className={styles.optionIcon}>{isSelected ? <FaCheck /> : null}</span>
              </div>
            );
          })}

          {showCreateOption && (
            <div
              key="__create_item__"
              ref={(el) => {
                itemsRef.current[options.length] = el;
              }}
              className={[
                styles.option,
                safeActiveIndex === options.length ? styles.optionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setActiveIndex(options.length)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                createAndSelect(trimmedQuery);
              }}>
              <span>
                {createLabel ? `${createLabel} "${trimmedQuery}"` : `Create "${trimmedQuery}"`}
              </span>
              <span className={styles.optionIcon}>+</span>
            </div>
          )}
        </div>
      </Popover>

      {multiSelect && (
        <div className={styles.badges}>
          {selectedKeys.length === 0 ? (
            <span className={styles.noTags}>{noSelectionLabel ?? "No items selected"}</span>
          ) : (
            selectedKeys.map((key) => {
              const matched = allItems.find((it) => getKey(it) === key);
              const badgeLabel = matched ? getLabel(matched) : key;
              return (
                <Badge
                  key={key}
                  variant="outline"
                  removable
                  onRemove={(event) => removeSelected(key, event)}>
                  {badgeLabel}
                </Badge>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
