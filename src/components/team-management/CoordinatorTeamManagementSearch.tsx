"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user";
import { Membership } from "@/types/memberships";
import Image from "next/image";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/team-management/CoordinatorTeamManagementSearch.module.css";

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
  const [roles, setRoles] = useState<Array<{ role_name: string; access: string; active: boolean }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    userNumber: string;
    roleName: string;
  } | null>(null);

  const fetchRoles = useCallback(
    async (team: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/roles?department=${encodeURIComponent(team)}`);
        if (response.ok) {
          const data = await response.json();
          const assignedRoles = initialMemberships
            .filter((membership) => membership.departmentName === team && membership.isActive)
            .map((membership) => membership.roleName);

          setRoles(
            Array.isArray(data)
              ? data.filter(
                  (role: { role_name: string; active: boolean }) =>
                    role.active && !assignedRoles.includes(role.role_name)
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
    },
    [initialMemberships]
  );

  useEffect(() => {
    setMemberships(
      initialMemberships.filter(
        (membership) => membership.departmentName === selectedTeam && membership.isActive
      )
    );
    setSelectedUser("");
    setSelectedRole("");
    setRoles([]);
    if (selectedTeam) {
      fetchRoles(selectedTeam);
    }
  }, [selectedTeam, initialMemberships, fetchRoles]);

  async function refreshMemberships() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/memberships");
      if (response.ok) {
        const data: Membership[] = await response.json();
        setMemberships(
          data.filter(
            (membership) => membership.departmentName === selectedTeam && membership.isActive
          )
        );
      }
    } catch {
      setError("Erro ao atualizar membros.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: selectedUser,
          departmentName: selectedTeam,
          roleName: selectedRole,
        }),
      });
      if (response.ok) {
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

  function handleRemoveMember(userNumber: string, roleName: string) {
    setPendingRemove({ userNumber, roleName });
    setConfirmOpen(true);
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    setLoading(true);
    setError("");
    setConfirmOpen(false);
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          istid: pendingRemove.userNumber,
          departmentName: selectedTeam,
          roleName: pendingRemove.roleName,
        }),
      });
      if (response.ok) {
        await refreshMemberships();
      } else {
        setError("Erro ao remover membro.");
      }
    } catch {
      setError("Erro ao remover membro.");
    } finally {
      setLoading(false);
      setPendingRemove(null);
    }
  }

  function cancelRemove() {
    setConfirmOpen(false);
    setPendingRemove(null);
  }

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        message="Tem a certeza que quer remover este membro?"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão da Equipa</h1>
        <select
          className={styles.teamSelector}
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
          disabled={loading || coordinatorTeams.length < 2}>
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
            onChange={(event) => setSelectedUser(event.target.value)}
            disabled={loading}>
            <option value="">Selecione um utilizador</option>
            {users.map((user) => (
              <option key={user.istid} value={user.istid}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <select
            className={styles.input}
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            disabled={loading}>
            <option value="">Selecione um cargo</option>
            {roles.map((role) => (
              <option key={role.role_name} value={role.role_name}>
                {role.role_name}
              </option>
            ))}
          </select>
          <button
            className={styles.addMemberBtn}
            type="submit"
            disabled={loading || !selectedUser || !selectedRole}>
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
              <div key={member.id} className={styles.memberCard}>
                <Image
                  className={styles.memberPhoto}
                  src={member.userPhoto}
                  alt={member.userName}
                  width={48}
                  height={48}
                />
                <div className={styles.memberName}>{member.userName}</div>
                <div className={styles.memberRole}>{member.roleName}</div>
                <div className={styles.memberEmail}>{member.userEmail}</div>
                <div className={styles.memberSince}>
                  Desde: {new Date(member.startDate).toLocaleDateString("pt-PT")}
                </div>
                <span className={styles.badge}>Ativo</span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleRemoveMember(member.userNumber, member.roleName)}
                  disabled={loading}>
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
