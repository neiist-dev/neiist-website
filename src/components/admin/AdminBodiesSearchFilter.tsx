"use client";

import { useState, useMemo } from "react";
import styles from "@/styles/components/admin/AdminBodiesSearchFilter.module.css";

interface AdminBody {
  name: string;
  active?: boolean;
}

export default function AdminBodiesSearchFilter({
  initialAdminBodies,
}: {
  initialAdminBodies: AdminBody[];
}) {
  const [adminBodies] = useState<AdminBody[]>(initialAdminBodies);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filteredAdminBodies = useMemo(() => {
    let filtered = adminBodies;
    filtered = showInactive
      ? filtered.filter((e) => e.active === false)
      : filtered.filter((e) => e.active !== false);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((adminBody) => adminBody.name.toLowerCase().includes(s));
    }
    return filtered;
  }, [adminBodies, search, showInactive]);

  const removeAdminBody = async (name: string) => {
    await fetch("/api/admin/admin-bodies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    window.location.reload();
  };

  return (
    <>
      <div className={styles.sectionTitle}>Órgãos Administrativos Existentes</div>
      <div className={styles.searchBar}>
        <input
          className={styles.input}
          type="text"
          placeholder="Pesquisar órgão administrativo..."
          value={search}
          onChange={(inputEvent) => setSearch(inputEvent.target.value)}
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
      <div className={styles.listSection}>
        {filteredAdminBodies.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum órgão administrativo encontrado.</div>
        ) : (
          <div className={styles.list}>
            {filteredAdminBodies.map((body) => (
              <div key={body.name} className={styles.item}>
                <div className={styles.itemContent}>
                  <div className={styles.itemName}>{body.name}</div>
                  {body.active === false && <span className={styles.badge}>Inativo</span>}
                </div>
                <button
                  onClick={() => removeAdminBody(body.name)}
                  className={styles.deleteButton}
                  title="Desativar órgão"
                  type="button">
                  Desativar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
