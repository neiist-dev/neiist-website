"use client";

import { useState, useMemo } from "react";
import styles from "@/styles/components/admin/TeamsSearchFilter.module.css";

interface Team {
  name: string;
  description?: string;
  active?: boolean;
}

export default function TeamsSearchFilter({ initialTeams }: { initialTeams: Team[] }) {
  const [teams] = useState<Team[]>(initialTeams);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filteredTeams = useMemo(() => {
    let filteredTeams = teams;
    if (showInactive) {
      filteredTeams = filteredTeams.filter((e) => e.active === false);
    } else {
      filteredTeams = filteredTeams.filter((e) => e.active !== false);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filteredTeams = filteredTeams.filter(
        (team) =>
          team.name.toLowerCase().includes(s) ||
          (team.description?.toLowerCase().includes(s) ?? false)
      );
    }
    return filteredTeams;
  }, [teams, search, showInactive]);

  const removeTeam = async (name: string) => {
    await fetch("/api/admin/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    window.location.reload();
  };

  return (
    <>
      <div className={styles.sectionTitle}>Equipas Existentes</div>
      <div className={styles.searchBar}>
        <input
          className={styles.input}
          type="text"
          placeholder="Pesquisar equipa..."
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
      {filteredTeams.length === 0 ? (
        <div className={styles.emptyMessage}>Nenhuma equipa encontrada.</div>
      ) : (
        <div className={styles.list}>
          {filteredTeams.map((team) => (
            <div key={team.name} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemName}>{team.name}</div>
                {team.description && (
                  <div className={styles.itemDescription}>{team.description}</div>
                )}
                {team.active === false && <span className={styles.badge}>Inativo</span>}
              </div>
              <button
                onClick={() => removeTeam(team.name)}
                className={styles.deleteBtn}
                title="Desativar equipa"
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
