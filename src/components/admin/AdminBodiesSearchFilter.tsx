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
  const [newAdminBodyName, setNewAdminBodyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredAdminBodies = useMemo(() => {
    let filteredAdminBodies = adminBodies;
    if (showInactive) {
      filteredAdminBodies = filteredAdminBodies.filter((e) => e.active === false);
    } else {
      filteredAdminBodies = filteredAdminBodies.filter((e) => e.active !== false);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filteredAdminBodies = filteredAdminBodies.filter((adminBody) =>
        adminBody.name.toLowerCase().includes(s)
      );
    }
    return filteredAdminBodies;
  }, [adminBodies, search, showInactive]);

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
        setErrorMessage(error.error || "Erro ao adicionar órgão administrativo");
      }
    } catch {
      setErrorMessage("Erro ao adicionar órgão administrativo");
    } finally {
      setLoading(false);
    }
  };

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
      <h3 className={styles.sectionTitle}>Adicionar Novo Órgão</h3>
      <form
        className={styles.form}
        onSubmit={(inputEvent) => {
          inputEvent.preventDefault();
          addAdminBody();
        }}>
        <input
          type="text"
          value={newAdminBodyName}
          onChange={(inputEvent) => setNewAdminBodyName(inputEvent.target.value)}
          placeholder="ex: Direção, Mesa da Assembleia Geral"
          className={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newAdminBodyName.trim()}
          className={styles.addButton}>
          {loading ? "A adicionar..." : "Adicionar Órgão"}
        </button>
        {errorMessage && (
          <div style={{ color: "#d32f2f", marginTop: "0.5rem", fontWeight: 500 }}>
            {errorMessage}
          </div>
        )}
      </form>

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
    </>
  );
}
