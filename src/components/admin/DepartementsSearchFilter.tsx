"use client";

import { useState, useMemo } from "react";
import styles from "@/styles/components/admin/DepartmentsSearchFilter.module.css";

interface Department {
  name: string;
  description?: string;
  active?: boolean;
}

interface DepartmentsSearchFilterProps<T extends Department> {
  entities: T[];
  entityLabel: string;
  onRemove: (name: string) => void;
  renderExtra?: (entity: T) => React.ReactNode;
}

export function DepartmentsSearchFilter<T extends Department>({
  entities,
  entityLabel,
  onRemove,
  renderExtra,
}: DepartmentsSearchFilterProps<T>) {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    let arr = entities;
    if (!showInactive) arr = arr.filter((e) => e.active !== false);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(
        (e) =>
          e.name.toLowerCase().includes(s) || (e.description?.toLowerCase().includes(s) ?? false)
      );
    }
    return arr;
  }, [entities, search, showInactive]);
  return (
    <>
      <div className={styles.sectionTitle}>
        {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}s Existentes
      </div>
      <div className={styles.searchBar}>
        <input
          className={styles.input}
          type="text"
          placeholder={`Pesquisar ${entityLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={`${styles.filterBtn} ${!showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(false)}
          type="button">
          Ativos
        </button>
        <button
          className={`${styles.filterBtn} ${showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(true)}
          type="button">
          Mostrar Inativos
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className={styles.emptyMessage}>Nenhum {entityLabel.toLowerCase()} encontrado.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((entity) => (
            <div key={entity.name} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemName}>{entity.name}</div>
                {entity.description && (
                  <div className={styles.itemDescription}>{entity.description}</div>
                )}
                {renderExtra?.(entity)}
                {entity.active === false && <span className={styles.badge}>Inativo</span>}
              </div>
              <button
                onClick={() => onRemove(entity.name)}
                className={styles.deleteBtn}
                title={`Desativar ${entityLabel}`}
                type="button">
                Desativar
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
