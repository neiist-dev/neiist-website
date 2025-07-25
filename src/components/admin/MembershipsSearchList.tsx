"use client";

import { useState, useMemo } from "react";
import { User } from "@/types/user";
import styles from "@/styles/components/admin/MembershipsSearchList.module.css";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  userEmail: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

interface Department {
  name: string;
  active: boolean;
}

export default function MembershipsSearchList({
  memberships: initialMemberships,
  users,
  departments,
}: {
  memberships: Membership[];
  users: Partial<User>[];
  departments: Department[];
}) {
  const [memberships, setMemberships] = useState(initialMemberships);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [newMembership, setNewMembership] = useState({
    userNumber: "",
    departmentName: "",
    roleName: "",
  });
  const [roles, setRoles] = useState<{ role_name: string; access: string; active: boolean }[]>([]);

  const filteredMemberships = useMemo(() => {
    let filtered = memberships;
    if (!showInactive) filtered = filtered.filter((membership) => membership.isActive);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (membership) =>
          membership.userName.toLowerCase().includes(s) ||
          membership.userNumber.toLowerCase().includes(s) ||
          membership.userEmail.toLowerCase().includes(s) ||
          membership.departmentName.toLowerCase().includes(s) ||
          membership.roleName.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [memberships, search, showInactive]);

  const handleDepartmentChange = async (departmentName: string) => {
    setNewMembership({ ...newMembership, departmentName, roleName: "" });
    if (departmentName) {
      const response = await fetch(
        `/api/admin/roles?department=${encodeURIComponent(departmentName)}`
      );
      if (response.ok) {
        const data = await response.json();
        setRoles(Array.isArray(data) ? data.filter((r: { active: boolean }) => r.active) : []);
      } else {
        setRoles([]);
      }
    } else {
      setRoles([]);
    }
  };

  const addMembership = async () => {
    setError("");
    if (!newMembership.userNumber || !newMembership.departmentName || !newMembership.roleName)
      return;
    setAdding(true);
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: newMembership.userNumber,
          departmentName: newMembership.departmentName,
          roleName: newMembership.roleName,
        }),
      });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/memberships");
        if (refreshed.ok) {
          const data = await refreshed.json();
          setMemberships(Array.isArray(data) ? data : []);
        }
        setNewMembership({ userNumber: "", departmentName: "", roleName: "" });
        setRoles([]);
      } else {
        const error = await response.json();
        setError(error.error || "Erro ao adicionar membro");
      }
    } catch {
      setError("Erro ao adicionar membro");
    } finally {
      setAdding(false);
    }
  };

  const removeMembership = async (userNumber: string, departmentName: string, roleName: string) => {
    setError("");
    if (!confirm("Tem a certeza que quer remover este membro?")) return;
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ istid: userNumber, departmentName, roleName }),
      });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/memberships");
        if (refreshed.ok) {
          const data = await refreshed.json();
          setMemberships(Array.isArray(data) ? data : []);
        }
      } else {
        const error = await response.json();
        setError(error.error || "Erro ao remover membro");
      }
    } catch {
      setError("Erro ao remover membro");
    }
  };

  return (
    <>
      <section className={styles.section}>
        <h3>Adicionar Novo Membro</h3>
        <div className={styles.addMemberForm}>
          <select
            value={newMembership.userNumber}
            onChange={(inputEvent) =>
              setNewMembership({ ...newMembership, userNumber: inputEvent.target.value })
            }
            className={styles.input}
            disabled={adding}>
            <option value="">Selecione um utilizador</option>
            {users.map((user) => (
              <option key={user.istid} value={user.istid}>
                {user.name} ({user.istid}) - {user.email}
              </option>
            ))}
          </select>
          <select
            value={newMembership.departmentName}
            onChange={(inputEvent) => handleDepartmentChange(inputEvent.target.value)}
            className={styles.input}
            disabled={adding}>
            <option value="">Selecione um departamento</option>
            {departments.map((dept) => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            value={newMembership.roleName}
            onChange={(inputEvent) =>
              setNewMembership({ ...newMembership, roleName: inputEvent.target.value })
            }
            className={styles.input}
            disabled={adding || !newMembership.departmentName}>
            <option value="">Selecione um cargo</option>
            {roles.map((role) => (
              <option key={role.role_name} value={role.role_name}>
                {role.role_name} ({role.access})
              </option>
            ))}
          </select>
          <button
            onClick={addMembership}
            disabled={
              adding ||
              !newMembership.userNumber ||
              !newMembership.departmentName ||
              !newMembership.roleName
            }
            className={styles.addMemberBtn}>
            {adding ? "A adicionar..." : "Adicionar Membro"}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </section>

      <section className={styles.section}>
        <h3>Membros Existentes</h3>
        <div className={styles.searchBar}>
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar por nome, ISTID, email, departamento ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`${styles.filterBtn} ${!showInactive ? styles.active : ""}`}
            onClick={() => setShowInactive(false)}>
            Ativos
          </button>
          <button
            className={`${styles.filterBtn} ${showInactive ? styles.active : ""}`}
            onClick={() => setShowInactive(true)}>
            Mostrar Inativos
          </button>
        </div>
        {filteredMemberships.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum membro encontrado.</div>
        ) : (
          <div className={styles.membersList}>
            {filteredMemberships.map((membership) => (
              <div key={membership.id} className={styles.members}>
                <div>
                  <div className={styles.memberName}>
                    {membership.userName} ({membership.userNumber})
                  </div>
                  <div>
                    <strong>Departamento:</strong> {membership.departmentName}
                  </div>
                  <div>
                    <strong>Cargo:</strong> {membership.roleName}
                  </div>
                  <div>
                    <strong>Email:</strong> {membership.userEmail}
                  </div>
                  <div>
                    <strong>Desde:</strong>{" "}
                    {new Date(membership.startDate).toLocaleDateString("pt-PT")}
                  </div>
                  {membership.endDate && (
                    <div>
                      <strong>Até:</strong>{" "}
                      {new Date(membership.endDate).toLocaleDateString("pt-PT")}
                    </div>
                  )}
                  <span
                    className={`${styles.badge} ${membership.isActive ? styles.memberStatus : styles.guest}`}>
                    {membership.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <button
                  onClick={() =>
                    removeMembership(
                      membership.userNumber,
                      membership.departmentName,
                      membership.roleName
                    )
                  }
                  className={styles.deleteBtn}>
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
