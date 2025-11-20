"use client";
import * as FA from "react-icons/fa";
import * as MD from "react-icons/md";
import * as IO from "react-icons/io5";
import * as TB from "react-icons/tb";
import * as GI from "react-icons/gi";
import * as HI from "react-icons/hi2";
import * as BS from "react-icons/bs";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { IconType } from "react-icons";
import styles from "@/styles/components/activities/IconPicker.module.css";

interface IconPickerProps {
  value: string | null;
  onChange: (_iconName: string) => void;
  onClose: () => void;
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

export default function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [search, setSearch] = useState("");

  const fuse = useMemo(() => {
    return new Fuse(ICON_NAMES, {
      includeScore: true,
      threshold: 0.3,
    });
  }, []);

  const filtered = useMemo(() => {
    if (search.trim() === "") return ICON_NAMES;
    return fuse.search(search).map((r) => r.item);
  }, [search, fuse]);

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
          <h3>Escolher Ícone</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
        <input
          type="text"
          placeholder="Procurar ícone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <div className={styles.grid}>
          {filtered.slice(0, 40).map((iconName) => {
            const Icon = getIcon(iconName);
            return (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className={`${styles.iconButton} ${value === iconName ? styles.selected : ""}`}>
                <Icon size={window.innerWidth <= 600 ? 18 : 24} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
