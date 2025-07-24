"use client";

import { useState } from "react";
import { DepartmentsSearchFilter } from "@/components/admin/DepartementsSearchFilter";
import styles from "@/styles/components/admin/AdminBodiesSearchFilter.module.css";

interface Department {
  name: string;
  description?: string;
  active?: boolean;
}

export function AdminBodiesSearch({ adminBodies }: { adminBodies: Department[] }) {
  return (
    <DepartmentsSearchFilter
      entities={adminBodies}
      entityLabel="órgão administrativo"
      onRemove={async (name: string) => {
        await fetch("/api/admin/admin-bodies", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        window.location.reload();
      }}
    />
  );
}

export function AddAdminBodyForm() {
  const [newAdminBodyName, setNewAdminBodyName] = useState("");
  const [loading, setLoading] = useState(false);

  const addAdminBody = async () => {
    if (!newAdminBodyName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/admin-bodies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAdminBodyName }),
      });
      if (response.ok) {
        setNewAdminBodyName("");
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao adicionar órgão administrativo");
      }
    } catch {
      alert("Erro ao adicionar órgão administrativo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className={styles.sectionTitle}>Adicionar Novo Órgão</h3>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          addAdminBody();
        }}>
        <input
          type="text"
          value={newAdminBodyName}
          onChange={(e) => setNewAdminBodyName(e.target.value)}
          placeholder="ex: Direção, Mesa da Assembleia Geral"
          className={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newAdminBodyName.trim()}
          className={styles.primaryBtn}>
          {loading ? "A adicionar..." : "Adicionar Órgão"}
        </button>
      </form>
    </>
  );
}
