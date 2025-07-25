"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/user";
import styles from "@/styles/components/team-management/CoordinatorTeamManagementSearch.module.css";

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

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

export default function CoordinatorTeamManagementSearch({
  coordinatorTeams,
  memberships: initialMemberships,
  users,
}: {
  coordinatorTeams: string[];
  memberships: Membership[];
  users: Partial<User>[];
}) {
  const [selectedTeam, setSelectedTeam] = useState(coordinatorTeams[0] || "");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    setMemberships(
      initialMemberships.filter(
        (m) => m.departmentName === selectedTeam && m.isActive
      )
    );
    setSelectedUser("");
    setSelectedRole("");
    setRoles([]);
    if (selectedTeam) {
      fetchRoles(selectedTeam);
    }
  }, [selectedTeam, initialMemberships]);

  async function fetchRoles(team: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles?department=${encodeURIComponent(team)}`);
      if (res.ok) {
        const data = await res.json();
        const assignedRoles = memberships.map((m) => m.roleName);
        setRoles(
          Array.isArray(data)
            ? data.filter(
                (r: Role) =>
                  r.active && !assignedRoles.includes(r.role_name)
              )
            : []
        );
      } else {
        setRoles([]);
      }
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMemberships() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/memberships");
      if (res.ok) {
        const data = await res.json();
        setMemberships(
          data
            .filter((m: Membership) => m.departmentName === selectedTeam && m.isActive)
            .map((m: Membership, idx: number) => ({
              ...m,
              id: `${m.userNumber}-${m.departmentName}-${m.roleName}-${idx}`,
            }))
        );
      }
    } catch {
      setError("Erro ao atualizar membros.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: selectedUser,
          departmentName: selectedTeam,
          roleName: selectedRole,
        }),
      });
      if (res.ok) {
        await refreshMemberships();
        setSelectedUser("");
        setSelectedRole("");
      } else {
        setError("Erro ao adicionar membro.");
      }
    } catch {
      setError("Erro ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userNumber: string, roleName: string) {
    if (!confirm("Tem a certeza que quer remover este membro?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: userNumber,
          departmentName: selectedTeam,
          roleName,
        }),
      });
      if (res.ok) {
        await refreshMemberships();
      } else {
        setError("Erro ao remover membro.");
      }
    } catch {
      setError("Erro ao remover membro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão da Equipa</h1>
        <select
          className={styles.teamSelector}
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          disabled={loading || coordinatorTeams.length < 2}
        >
          {coordinatorTeams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Adicionar Novo Membro</h3>
        <form className={styles.addMemberForm} onSubmit={handleAddMember}>
          <select
            className={styles.input}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loading}
          >
            <option value="">Selecione um utilizador</option>
            {users.map((u) => (
              <option key={u.istid} value={u.istid}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <select
            className={styles.input}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
          >
            <option value="">Selecione um cargo</option>
            {roles.map((r) => (
              <option key={r.role_name} value={r.role_name}>
                {r.role_name}
              </option>
            ))}
          </select>
          <button
            className={styles.addMemberBtn}
            type="submit"
            disabled={loading || !selectedUser || !selectedRole}
          >
            Adicionar Membro
          </button>
        </form>
        {error && <div className={styles.error}>{error}</div>}
      </section>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Membros Existentes</h3>
        {memberships.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum membro encontrado.</div>
        ) : (
          <div className={styles.membersList}>
            {memberships.map((member) => (
              <div key={member.id} className={styles.members}>
                <div>
                  <div className={styles.memberName}>
                    {member.userName} ({member.userNumber})
                  </div>
                  <div>
                    <span className={styles.label}>Departamento:</span> {member.departmentName}
                  </div>
                  <div>
                    <span className={styles.label}>Cargo:</span> {member.roleName}
                  </div>
                  <div>
                    <span className={styles.label}>Email:</span> {member.userEmail}
                  </div>
                  <div>
                    <span className={styles.label}>Desde:</span> {new Date(member.startDate).toLocaleDateString('pt-PT')}
                  </div>
                  <span className={styles.badge + " " + styles.memberStatus}>Ativo</span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleRemoveMember(member.userNumber, member.roleName)}
                  disabled={loading}
                >
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
