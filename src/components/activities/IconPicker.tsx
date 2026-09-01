"use client";

import * as FA from "react-icons/fa";
import * as MD from "react-icons/md";
import * as IO from "react-icons/io5";
import * as TB from "react-icons/tb";
import * as GI from "react-icons/gi";
import * as HI from "react-icons/hi2";
import * as BS from "react-icons/bs";
import { IconType } from "react-icons";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/activities/IconPicker.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface IconPickerProps {
  value: string | null;
  onChange: (_iconName: string) => void;
  onClose: () => void;
  dict: Dictionary["activities"]["details"]["icon_picker"];
}

const ALL_ICONS = {
  ...FA,
  ...MD,
  ...IO,
  ...TB,
  ...GI,
  ...HI,
  ...BS,
};

const ICON_NAMES = Object.keys(ALL_ICONS);

export default function IconPicker({ value, onChange, onClose, dict }: IconPickerProps) {
  const {
    results: filtered,
    query: search,
    setQuery: setSearch,
  } = useSearch<string>({
    data: ICON_NAMES,
    fields: ["self"],
    extractField: (item) => item,
    returnAllWhenEmpty: true,
    limit: 60,
  });

  const getIcon = (iconName: string): IconType => {
    return (ALL_ICONS[iconName as keyof typeof ALL_ICONS] as IconType) || FA.FaQuestionCircle;
  };

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    onClose();
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{dict.title}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
        <Search
          className={styles.search}
          placeholder={dict.search_placeholder}
          value={search}
          onChange={setSearch}
        />
        <div className={styles.grid}>
          {filtered.slice(0, 40).map((iconName) => {
            const IconComponent = getIcon(iconName);
            return (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className={`${styles.iconButton} ${value === iconName ? styles.selected : ""}`}>
                {IconComponent({ size: 24 })}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
