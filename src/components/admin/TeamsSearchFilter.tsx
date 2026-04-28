"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import styles from "@/styles/components/admin/TeamsSearchFilter.module.css";

interface Team {
  name: string;
  description?: string;
  active?: boolean;
}

export default function TeamsSearchFilter({ initialTeams, dict }: { 
  initialTeams: Team[] 
  dict: {
    title: string;
    section_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    inactive_badge: string;
    deactivate_title: string;
    deactivate: string;
  };
}) {
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
        <input
          className={styles.input}
          type="text"
          placeholder={dict.search_placeholder}
          value={search}
          onChange={(inputEvent) => setSearch(inputEvent.target.value)}
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
                {team.active === false && <span className={styles.badge}>{dict.inactive_badge}</span>}
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
