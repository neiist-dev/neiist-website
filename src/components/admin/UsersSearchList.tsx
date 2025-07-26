"use client";

import { useState, useMemo, useRef } from "react";
import { User, UserRole } from "@/types/user";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import styles from "@/styles/components/admin/UsersSearchList.module.css";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
}

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

export default function UsersSearchList({
  users,
  roles,
}: {
  users: UserWithMemberships[];
  roles: Role[];
}) {
  const [search, setSearch] = useState("");
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const [usersState, setUsersState] = useState(users);
  const { setUser } = useUser();

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return usersState;
    return usersState.filter(
      (user) =>
        user.name.toLowerCase().includes(s) ||
        user.istid.toLowerCase().includes(s) ||
        user.email.toLowerCase().includes(s)
    );
  }, [search, usersState]);

  const getAccessLevelForRole = (roleName: string): string => {
    const role = roles.find((role) => role.role_name === roleName);
    return role?.access || UserRole._GUEST;
  };

  const getAccessClass = (accessLevel: string): string => {
    return styles[accessLevel] || styles.guest;
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoClick = (istid: string) => {
    setEditingPhotoIstid(istid);
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>, istid: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const res = await fetch(`/api/user/update/${istid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      if (res.ok) {
        setUsersState((prev) =>
          prev.map((u) =>
            u.istid === istid ? { ...u, photo: `/api/user/photo/${istid}?custom&${Date.now()}` } : u
          )
        );
        const userRes = await fetch("/api/auth/userdata");
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          setUser(updatedUser);
        }
      }
      setEditingPhotoIstid(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        className={styles.input}
        style={{ marginBottom: 16, width: "100%" }}
        type="text"
        placeholder="Pesquisar por nome, ISTID ou email..."
        value={search}
        onChange={(inputEvent) => setSearch(inputEvent.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          if (editingPhotoIstid) handlePhotoChange(e, editingPhotoIstid);
        }}
      />

      {filteredUsers.length === 0 ? (
        <p className={styles.emptyMessage}>Nenhum utilizador encontrado.</p>
      ) : (
        <div className={styles.itemsList}>
          {filteredUsers.map((user) => (
            <section key={user.istid} className={styles.item}>
              <div className={styles.changePhoto}>
                <Image
                  src={user.photo}
                  height={200}
                  width={200}
                  alt={`Foto de ${user.name}`}
                  className={styles.userPhoto}
                  style={{ cursor: "pointer" }}
                  onClick={() => handlePhotoClick(user.istid)}
                  title="Clique para alterar a foto"
                />
              </div>
              <div className={styles.itemContent}>
                <h4>
                  {user.name} <span className={styles.istid}>({user.istid})</span>
                </h4>
                <p className={styles.hideOnMobile}>
                  <strong>Email:</strong> {user.email}
                </p>
                {user.phone && (
                  <p className={styles.hideOnMobile}>
                    <strong>Telefone:</strong> {user.phone}
                  </p>
                )}
                {user.courses?.length > 0 && (
                  <p className={styles.hideOnMobile}>
                    <strong>Cursos:</strong> {user.courses.join(", ")}
                  </p>
                )}
                {user.memberships?.length > 0 && (
                  <>
                    <strong>Equipas/Órgãos:</strong>
                    <ul className={styles.membershipsList}>
                      {user.memberships.map((membership, id) => {
                        const accessLevel = getAccessLevelForRole(membership.roleName);
                        return (
                          <li key={id} className={styles.membershipItem}>
                            <span className={styles.teamName}>{membership.departmentName}</span>
                            <span className={styles.roleSeparator}>–</span>
                            <span>{membership.roleName}</span>
                            <span
                              className={`${styles.accessBadge} ${getAccessClass(accessLevel)}`}>
                              {accessLevel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
