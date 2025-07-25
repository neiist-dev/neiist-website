"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "@/styles/components/admin/RolesSearchFilter.module.css";

interface Role {
  role_name: string;
  access: string;
  active: boolean;
  department?: string;
}

interface Department {
  name: string;
  active: boolean;
}

export default function RolesSearchFilter({
  departments,
  initialRoles,
}: {
  departments: Department[];
  initialDepartment: string;
  initialRoles: Role[];
}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addDepartment, setAddDepartment] = useState<string>("");
  const [newRole, setNewRole] = useState({ roleName: "", access: "member" });
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async (department: string) => {
    if (!department) return;
    try {
      const response = await fetch(`/api/admin/roles?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data.map((r: Role) => ({ ...r, department })));
      } else setRoles([]);
    } catch {
      setRoles([]);
    }
  }, []);

  const fetchAllRoles = useCallback(async () => {
    try {
      const results = await Promise.all(
        departments.map(async (dept) => {
          const response = await fetch(
            `/api/admin/roles?department=${encodeURIComponent(dept.name)}`
          );
          if (response.ok) {
            const data = await response.json();
            return data.map((r: Role) => ({ ...r, department: dept.name }));
          }
          return [];
        })
      );
      setRoles(results.flat());
    } catch {
      setRoles([]);
    }
  }, [departments]);

  useEffect(() => {
    if (selectedDepartment === "") {
      fetchAllRoles();
    } else if (selectedDepartment) {
      fetchRoles(selectedDepartment);
    } else {
      setRoles([]);
    }
  }, [selectedDepartment, fetchAllRoles, fetchRoles]);

  const addRole = async () => {
    setError("");
    if (!newRole.roleName.trim() || !addDepartment) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentName: addDepartment,
          roleName: newRole.roleName,
          access: newRole.access,
        }),
      });
      if (response.ok) {
        setNewRole({ roleName: "", access: "member" });
        if (addDepartment === selectedDepartment || selectedDepartment === "") {
          if (selectedDepartment === "") {
            await fetchAllRoles();
          } else {
            await fetchRoles(selectedDepartment);
          }
        }
      } else {
        const error = await response.json();
        setError(error.error || "Erro ao adicionar cargo");
      }
    } catch {
      setError("Erro ao adicionar cargo");
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (roleName: string, departmentName?: string) => {
    setError("");
    const dept = selectedDepartment === "" ? departmentName : selectedDepartment;
    if (!dept) return;
    if (!confirm(`Tem a certeza que quer remover o cargo "${roleName}" do departamento "${dept}"?`))
      return;
    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentName: dept, roleName }),
      });
      if (response.ok) {
        if (selectedDepartment === "") {
          await fetchAllRoles();
        } else {
          await fetchRoles(dept);
        }
      } else {
        const error = await response.json();
        setError(error.error || "Erro ao remover cargo");
      }
    } catch {
      setError("Erro ao remover cargo");
    }
  };

  const filteredRoles = useMemo(() => {
    let filtered = roles;
    if (!showInactive) filtered = filtered.filter((role) => role.active);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (role) =>
          role.role_name.toLowerCase().includes(s) ||
          role.access.toLowerCase().includes(s) ||
          (role.department && role.department.toLowerCase().includes(s))
      );
    }
    if (selectedDepartment === "") {
      filtered = filtered.sort(
        (a, b) =>
          (a.department || "").localeCompare(b.department || "") ||
          a.role_name.localeCompare(b.role_name)
      );
    }
    return filtered;
  }, [roles, search, showInactive, selectedDepartment]);

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionTitle}>Adicionar Novo Cargo</div>
        <form
          className={styles.addRoleForm}
          onSubmit={(inputEvent) => {
            inputEvent.preventDefault();
            addRole();
          }}>
          <div className={styles.row}>
            <select
              value={addDepartment}
              onChange={(inputEvent) => setAddDepartment(inputEvent.target.value)}
              className={styles.select}
              disabled={loading}>
              <option value="">Todos</option>
              {departments.map((dept) => (
                <option key={dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newRole.roleName}
              onChange={(inputEvent) =>
                setNewRole({ ...newRole, roleName: inputEvent.target.value })
              }
              placeholder="Nome do Cargo"
              className={styles.input}
              disabled={loading}
            />
            <select
              value={newRole.access}
              onChange={(inputEvent) => setNewRole({ ...newRole, access: inputEvent.target.value })}
              className={styles.select}
              disabled={loading}>
              <option value="guest">Convidado</option>
              <option value="member">Membro</option>
              <option value="coordinator">Coordenador</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={loading || !newRole.roleName.trim() || !addDepartment}
              className={styles.addRoleBtn}>
              {loading ? "A adicionar..." : "Adicionar Cargo"}
            </button>
          </div>
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>Cargos Existentes</div>
        <div className={styles.filterBar}>
          <select
            value={selectedDepartment}
            onChange={(inputEvent) => setSelectedDepartment(inputEvent.target.value)}
            className={styles.select}>
            <option value="">Todos</option>
            {departments.map((dept) => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="text"
            placeholder="Pesquisar cargo, nível de acesso ou departamento..."
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
        {filteredRoles.length === 0 ? (
          <div className={styles.emptyMessage}>
            {selectedDepartment === ""
              ? "Nenhum cargo encontrado."
              : "Selecione um departamento para ver os cargos."}
          </div>
        ) : (
          <div className={styles.rolesList}>
            {filteredRoles.map((role, index) => (
              <div
                key={role.role_name + (role.department || "") + index}
                className={styles.roleCard}>
                <div>
                  <div className={styles.roleName}>
                    {role.role_name}
                    {selectedDepartment === "" && role.department && (
                      <span className={styles.departmentName}>({role.department})</span>
                    )}
                  </div>
                  <span
                    className={`${styles.badge}${role.access === "admin" ? " " + styles.admin : ""}`}>
                    {role.access}
                  </span>
                  <span className={`${styles.badge}${!role.active ? " " + styles.inactive : ""}`}>
                    {role.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {role.active && (
                  <button
                    onClick={() => removeRole(role.role_name, role.department)}
                    className={styles.deleteBtn}>
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
