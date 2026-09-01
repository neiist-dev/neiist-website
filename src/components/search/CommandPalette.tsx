"use client";

import { useEffect, ReactNode } from "react";
import { Command } from "cmdk";
import { MdSearch, MdClose } from "react-icons/md";
import styles from "@/styles/components/search/CommandPalette.module.css";

export interface CommandPaletteGroup<T> {
  id?: string;
  heading?: string;
  items: T[];
}

export interface CommandPaletteProps<T> {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  groups: CommandPaletteGroup<T>[];
  getItemKey: (_item: T) => string;
  getItemLabel: (_item: T) => string;
  getItemValue?: (_item: T) => string;
  renderItem?: (_item: T) => ReactNode;
  onSelect: (_item: T) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export default function CommandPalette<T>({
  open,
  onOpenChange,
  groups,
  getItemKey,
  getItemLabel,
  getItemValue,
  renderItem,
  onSelect,
  placeholder = "Pesquisar...",
  emptyMessage = "Nenhum resultado encontrado.",
}: CommandPaletteProps<T>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className={styles.dialogOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}>
      <Command className={styles.commandRoot} label="Pesquisa Global">
        <div className={styles.inputWrap}>
          <MdSearch size="1.25rem" className={styles.searchIcon} />
          <Command.Input className={styles.commandInput} placeholder={placeholder} autoFocus />
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => onOpenChange(false)}
            aria-label="Fechar">
            <MdClose size="1.125rem" />
          </button>
        </div>

        <Command.List className={styles.commandList}>
          <Command.Empty className={styles.commandEmpty}>{emptyMessage}</Command.Empty>

          {groups.map((group) => (
            <Command.Group
              key={group.id ?? group.heading ?? "group"}
              heading={group.heading}
              className={styles.commandGroup}>
              {group.items.map((item) => {
                const key = getItemKey(item);
                const label = getItemLabel(item);
                const value = getItemValue ? getItemValue(item) : label;

                return (
                  <Command.Item
                    key={key}
                    value={value}
                    onSelect={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                    className={styles.commandItem}>
                    {renderItem ? renderItem(item) : label}
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
