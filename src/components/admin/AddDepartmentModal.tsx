"use client";
import { useState } from "react";
import styles from "@/styles/components/admin/AddDepartmentModal.module.css";

interface Role {
  roleName: string;
  access: "guest" | "member" | "coordinator" | "admin";
}

interface AddDepartmentModalProps {
  departmentType: "team" | "admin_body";
  dict: {
    add_team_button: string;
    add_body_button: string;
    new_team_title: string;
    new_body_title: string;
    team_name_placeholder: string;
    body_name_placeholder: string;
    team_desc_placeholder: string;
    next: string;
    add_roles_title: string;
    remove: string;
    back: string;
    creating: string;
    create_department: string;
    errors: {
      create_department: string;
      create_role: string;
      create_department_or_roles: string;
    };
    role_form: {
      role_name_placeholder: string;
      add_role: string;
      access: {
        guest: string;
        member: string;
        coordinator: string;
        admin: string;
      };
    };
  };
}

export default function AddDepartmentModal({
  departmentType,
  dict
}: AddDepartmentModalProps) {
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
        // TODO: (ERROR)
        setError(err.error || dict.errors.create_department);
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
          // TODO: (ERROR)
          setError(err.error || dict.errors.create_role);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
      // TODO: (SUCCESS) show success toast after the department and roles are created.
      window.location.reload();
    } catch {
      // TODO: (ERROR)
      setError(dict.errors.create_department_or_roles);
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.button} onClick={() => setOpen(true)}>
        {departmentType === "team" ? dict.add_team_button : dict.add_body_button}
      </button>
      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              ×
            </button>
            {step === 1 && (
              <>
                <h2>{departmentType === "team" ? dict.new_team_title : dict.new_body_title}</h2>
                <form
                  className={styles.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}>
                  <input
                    type="text"
                    placeholder={departmentType === "team" ? dict.team_name_placeholder : dict.body_name_placeholder}
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    required
                    className={styles.input}
                    disabled={loading}
                  />
                  {departmentType === "team" && (
                    <textarea
                      placeholder={dict.team_desc_placeholder}
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
                    {dict.next}
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
                  <h4>{dict.add_roles_title}</h4>
                  <RoleCreationForm onAdd={addRole} disabled={loading} dict={dict.role_form} />
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
                          {dict.remove}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* TODO: replace this inline error with a toast and remove this fallback once Sonner is implemented here. */}
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.actions}>
                  <button className={styles.button} onClick={() => setStep(1)} disabled={loading}>
                    {dict.back}
                  </button>
                  <button
                    className={styles.button}
                    onClick={handleCreate}
                    disabled={loading || roles.length === 0}>
                    {loading ? dict.creating : dict.create_department}
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
  dict,
}: {
  onAdd: (_role: Role) => void;
  disabled: boolean;
  dict: {
    role_name_placeholder: string;
    add_role: string;
    access: { 
      guest: string; 
      member: string; 
      coordinator: string; 
      admin: string 
    };
  };
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
          placeholder={dict.role_name_placeholder}
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
          <option value="guest">{dict.access.guest}</option>
          <option value="member">{dict.access.member}</option>
          <option value="coordinator">{dict.access.coordinator}</option>
          <option value="admin">{dict.access.admin}</option>
        </select>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="submit"
          className={styles.button}
          disabled={disabled || !role.roleName.trim()}>
          {dict.add_role}
        </button>
      </div>
    </form>
  );
}
