"use client";

import { useRef, useEffect, useState } from "react";
import { DepartmentsSearchFilter } from "@/components/admin/DepartementsSearchFilter";
import styles from "@/styles/components/admin/TeamsSearchFilter.module.css";

interface Department {
  name: string;
  description?: string;
  active?: boolean;
}

export function TeamsSearch({ teams }: { teams: Department[] }) {
  return (
    <DepartmentsSearchFilter
      entities={teams}
      entityLabel="equipa"
      onRemove={async (name: string) => {
        await fetch("/api/admin/teams", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        window.location.reload();
      }}
    />
  );
}

export function AddTeamForm() {
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [newTeam.description]);

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
    </>
  );
}
