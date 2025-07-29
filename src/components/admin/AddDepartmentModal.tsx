"use client";
import { useState } from "react";
import styles from "@/styles/components/admin/AddDepartmentModal.module.css";

interface Role {
  roleName: string;
  access: "guest" | "member" | "coordinator" | "admin";
}

export default function AddDepartmentModal({
  departmentType,
}: {
  departmentType: "team" | "admin_body";
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addRole = (role: Role) => setRoles((prev) => [...prev, role]);
  const removeRole = (roleName: string) =>
    setRoles((prev) => prev.filter((r) => r.roleName !== roleName));

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const depRes = await fetch(
        departmentType === "team" ? "/api/admin/teams" : "/api/admin/admin-bodies",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            departmentType === "team"
              ? { name: deptName, description: deptDesc }
              : { name: deptName }
          ),
        }
      );
      if (!depRes.ok) {
        const err = await depRes.json();
        setError(err.error || "Erro ao criar departamento");
        setLoading(false);
        return;
      }
      for (const role of roles) {
        const roleRes = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departmentName: deptName,
            roleName: role.roleName,
            access: role.access,
          }),
        });
        if (!roleRes.ok) {
          const err = await roleRes.json();
          setError(err.error || "Erro ao criar cargo");
          setLoading(false);
          return;
        }
      }
      setLoading(false);
      window.location.reload();
    } catch {
      setError("Erro ao criar departamento ou cargos");
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.button} onClick={() => setOpen(true)}>
        {departmentType === "team" ? "Adicionar Nova Equipa" : "Adicionar Novo Órgão"}
      </button>
      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              ×
            </button>
            {step === 1 && (
              <>
                <h2>{departmentType === "team" ? "Nova Equipa" : "Novo Órgão Administrativo"}</h2>
                <form
                  className={styles.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}>
                  <input
                    type="text"
                    placeholder={departmentType === "team" ? "Nome da equipa" : "Nome do órgão"}
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    required
                    className={styles.input}
                    disabled={loading}
                  />
                  {departmentType === "team" && (
                    <textarea
                      placeholder="Descrição da equipa"
                      value={deptDesc}
                      onChange={(e) => setDeptDesc(e.target.value)}
                      required
                      className={styles.input}
                      disabled={loading}
                    />
                  )}
                  <button
                    type="submit"
                    className={styles.button}
                    disabled={!deptName.trim() || (departmentType === "team" && !deptDesc.trim())}>
                    Próximo
                  </button>
                </form>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ marginBottom: "1.2rem", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{deptName}</div>
                  {departmentType === "team" && deptDesc && (
                    <div style={{ color: "#64748b", fontSize: "1rem", marginTop: 2 }}>
                      {deptDesc}
                    </div>
                  )}
                </div>
                <div className={styles.rolesSection}>
                  <h4>Adicionar Cargos</h4>
                  <RoleCreationForm onAdd={addRole} disabled={loading} />
                  <ul className={styles.rolesList}>
                    {roles.map((role, idx) => (
                      <li key={role.roleName + idx}>
                        <span>
                          {role.roleName} ({role.access})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRole(role.roleName)}
                          disabled={loading}
                          className={styles.removeBtn}>
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => setStep(1)} disabled={loading}>
                    Voltar
                  </button>
                  <button
                    className={styles.button}
                    onClick={handleCreate}
                    disabled={loading || roles.length === 0}>
                    {loading ? "A criar..." : "Criar Departamento"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function RoleCreationForm({
  onAdd,
  disabled,
}: {
  onAdd: (_role: Role) => void;
  disabled: boolean;
}) {
  const [role, setRole] = useState<Role>({ roleName: "", access: "member" });

  return (
    <form
      className={styles.roleForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (!role.roleName.trim()) return;
        onAdd(role);
        setRole({ roleName: "", access: "member" });
      }}>
      <div className={styles.roleFormRow}>
        <input
          type="text"
          placeholder="Nome do Cargo"
          value={role.roleName}
          onChange={(e) => setRole((prev) => ({ ...prev, roleName: e.target.value }))}
          required
          disabled={disabled}
          className={styles.input}
        />
        <select
          value={role.access}
          onChange={(e) =>
            setRole((prev) => ({ ...prev, access: e.target.value as Role["access"] }))
          }
          disabled={disabled}
          className={styles.input}>
          <option value="guest">Normal</option>
          <option value="member">Membro</option>
          <option value="coordinator">Coordenador</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="submit"
          className={styles.button}
          disabled={disabled || !role.roleName.trim()}>
          Adicionar Cargo
        </button>
      </div>
    </form>
  );
}
