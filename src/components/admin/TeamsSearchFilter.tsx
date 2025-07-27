"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newTeam.description]);

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

  const addTeam = async () => {
    if (!newTeam.name.trim() || !newTeam.description.trim()) {
      setErrorMessage("Nome e descrição são obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/teams");
        if (refreshed.ok) {
          const data = await refreshed.json();
          setTeams(Array.isArray(data) ? data : []);
        }
        setNewDepartmentName(newTeam.name);
        setShowAddRoleDialog(true);
        setNewTeam({ name: "", description: "" });
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Erro ao adicionar equipa");
      }
    } catch {
      setErrorMessage("Erro ao adicionar equipa");
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
      <ConfirmDialog
        open={showAddRoleDialog}
        message={`Deseja adicionar cargos ao novo departamento "${newDepartmentName}"?`}
        onConfirm={() => {
          setShowAddRoleDialog(false);
          const rolesSectionElement = document.getElementById("roles-section");
          if (rolesSectionElement) rolesSectionElement.scrollIntoView({ behavior: "smooth" });
          window.dispatchEvent(new CustomEvent("selectDepartment", { detail: newDepartmentName }));
        }}
        onCancel={() => setShowAddRoleDialog(false)}
      />
      <h3 className={styles.sectionTitle}>Adicionar Nova Equipa</h3>
      <form
        className={styles.form}
        onSubmit={(inputEvent) => {
          inputEvent.preventDefault();
          addTeam();
        }}>
        <input
          type="text"
          value={newTeam.name}
          onChange={(inputEvent) => setNewTeam({ ...newTeam, name: inputEvent.target.value })}
          placeholder="Nome da equipa"
          className={styles.input}
          disabled={loading}
          required
        />
        <textarea
          ref={textareaRef}
          value={newTeam.description}
          onChange={(inputEvent) =>
            setNewTeam({ ...newTeam, description: inputEvent.target.value })
          }
          placeholder="Descrição da equipa (obrigatória)"
          className={styles.input}
          disabled={loading}
          rows={2}
          style={{ overflow: "hidden" }}
          required
        />
        <button
          type="submit"
          disabled={loading || !newTeam.name.trim() || !newTeam.description.trim()}
          className={styles.primaryBtn}>
          {loading ? "A adicionar..." : "Adicionar Equipa"}
        </button>
        {errorMessage && (
          <div style={{ color: "#d32f2f", marginTop: "0.5rem", fontWeight: 500 }}>
            {errorMessage}
          </div>
        )}
      </form>

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
