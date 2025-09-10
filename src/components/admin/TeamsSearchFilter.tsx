"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
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

  const fuse = useMemo(
    () =>
      new Fuse(teams, {
        keys: ["name", "description"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [teams]
  );

  const filteredTeams = useMemo(() => {
    let filteredTeams = showInactive
      ? teams.filter((team) => team.active === false)
      : teams.filter((team) => team.active !== false);
    if (search.trim()) {
      const results = fuse.search(search.trim());
      filteredTeams = filteredTeams.filter((team) =>
        results.some((r) => r.item.name === team.name)
      );
    }
    return filteredTeams;
  }, [teams, search, showInactive, fuse]);

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
