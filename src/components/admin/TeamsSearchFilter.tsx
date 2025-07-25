"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import styles from "@/styles/components/admin/TeamsSearchFilter.module.css";

interface Team {
  name: string;
  description?: string;
  active?: boolean;
}

export default function TeamsSearchFilter({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newTeam.description]);

  const filteredTeams = useMemo(() => {
    let arr = teams;
    if (!showInactive) arr = arr.filter((e) => e.active !== false);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter(
        (e) =>
          e.name.toLowerCase().includes(s) || (e.description?.toLowerCase().includes(s) ?? false)
      );
    }
    return arr;
  }, [teams, search, showInactive]);

  const addTeam = async () => {
    if (!newTeam.name.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      if (response.ok) {
        setNewTeam({ name: "", description: "" });
        // Optionally, fetch updated teams or reload
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao adicionar equipa");
      }
    } catch {
      alert("Erro ao adicionar equipa");
    } finally {
      setLoading(false);
    }
  };

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
      <h3 className={styles.sectionTitle}>Adicionar Nova Equipa</h3>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          addTeam();
        }}>
        <input
          type="text"
          value={newTeam.name}
          onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
          placeholder="Nome da equipa"
          className={styles.input}
          disabled={loading}
        />
        <textarea
          ref={textareaRef}
          value={newTeam.description}
          onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
          placeholder="Descrição da equipa (opcional)"
          className={styles.input}
          disabled={loading}
          rows={2}
          style={{ overflow: "hidden" }}
        />
        <button
          type="submit"
          disabled={loading || !newTeam.name.trim()}
          className={styles.primaryBtn}>
          {loading ? "A adicionar..." : "Adicionar Equipa"}
        </button>
      </form>

      <div className={styles.sectionTitle}>Equipas Existentes</div>
      <div className={styles.searchBar}>
        <input
          className={styles.input}
          type="text"
          placeholder="Pesquisar equipa..."
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
