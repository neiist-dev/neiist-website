"use client";

import { useState, useMemo } from "react";
import styles from "@/styles/components/admin/TeamsSearchFilter.module.css";
import Search from "@/components/search/Search";
import { useSearch } from "@/hooks/useSearch";
import type { Dictionary } from "@/i18n/dictionaries";

interface Team {
  name: string;
  description?: string;
  active?: boolean;
}

export default function TeamsSearchFilter({
  initialTeams,
  dict,
}: {
  initialTeams: Team[];
  dict: Dictionary["admin"]["teams_management"];
}) {
  const [teams] = useState<Team[]>(initialTeams);
  const [showInactive, setShowInactive] = useState(false);

  const baseTeams = useMemo(() => {
    return showInactive
      ? teams.filter((team) => team.active === false)
      : teams.filter((team) => team.active !== false);
  }, [teams, showInactive]);

  const {
    results: filteredTeams,
    query: search,
    setQuery: setSearch,
  } = useSearch<Team>({
    data: baseTeams,
    fields: [{ field: "name", boost: 2 }, "description"],
    returnAllWhenEmpty: true,
  });

  const removeTeam = async (name: string) => {
    // TODO: show loading toast while the team is being deactivated.
    await fetch("/api/admin/teams", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    // TODO: show success toast after the team is deactivated, and an error toast if this request fails.
    window.location.reload();
  };

  return (
    <>
      <div className={styles.sectionTitle}>{dict.section_title}</div>
      <div className={styles.searchBar}>
        <Search
          className={styles.input}
          placeholder={dict.search_placeholder}
          value={search}
          onChange={setSearch}
        />
        <button
          className={`${styles.filterBtn} ${!showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(false)}
          type="button">
          {dict.active}
        </button>
        <button
          className={`${styles.filterBtn} ${showInactive ? styles.active : ""}`}
          onClick={() => setShowInactive(true)}
          type="button">
          {dict.show_inactive}
        </button>
      </div>
      {filteredTeams.length === 0 ? (
        <div className={styles.emptyMessage}>{dict.empty}</div>
      ) : (
        <div className={styles.list}>
          {filteredTeams.map((team) => (
            <div key={team.name} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemName}>{team.name}</div>
                {team.description && (
                  <div className={styles.itemDescription}>{team.description}</div>
                )}
                {team.active === false && (
                  <span className={styles.badge}>{dict.inactive_badge}</span>
                )}
              </div>
              <button
                onClick={() => removeTeam(team.name)}
                className={styles.deleteBtn}
                title={dict.deactivate_title}
                type="button">
                {dict.deactivate}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
