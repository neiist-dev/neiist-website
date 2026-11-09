"use client";

import React, { useCallback } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { Modal, SearchInput } from "@neiist/ui";
import { useSearch } from "@/hooks/useSearch";
import { ALL_ICONS } from "@/components/activities/EventIcons";
import styles from "@/styles/components/activities/admin/IconPicker.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface IconPickerProps {
  value: string | null;
  onChange: (_iconName: string) => void;
  onClose: () => void;
  dict: Dictionary["activities"]["details"]["icon_picker"];
}

const ICON_NAMES = Object.keys(ALL_ICONS);

export default function IconPicker({ value, onChange, onClose, dict }: IconPickerProps) {
  const {
    results: filtered,
    query: search,
    setQuery: setSearch,
  } = useSearch<string>({
    data: ICON_NAMES,
    fields: ["self"],
    extractField: (item) =>
      item
        .replace(/^[A-Z][a-z0-9]*/, (prefix) => `${prefix} `)
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2"),
    returnAllWhenEmpty: true,
    limit: 60,
  });

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange(iconName);
      onClose();
    },
    [onChange, onClose]
  );

  return (
    <Modal open={true} onClose={onClose} size="md" title={dict.title}>
      <div className={styles.container}>
        <SearchInput placeholder={dict.search_placeholder} value={search} onChange={setSearch} />
        <div className={styles.grid}>
          {filtered.slice(0, 48).map((iconName) => {
            const IconComponent = ALL_ICONS[iconName] || FaQuestionCircle;
            const isSelected = value === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => handleSelect(iconName)}
                title={iconName}
                aria-label={iconName}
                className={`${styles.iconButton} ${isSelected ? styles.selected : ""}`}>
                <IconComponent size={24} />
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
