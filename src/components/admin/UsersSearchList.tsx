"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { User, UserRole } from "@/types/user";
import { Membership } from "@/types/memberships";
import styles from "@/styles/components/admin/UsersSearchList.module.css";

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

const sanitizeString = (value: string) =>
  value.trim().normalize("NFD").replace(/\p{M}/gu, "").replace(/[-_]/g, " ").toLowerCase();

export default function UsersSearchList({
  users,
  roles,
}: {
  users: UserWithMemberships[];
  roles: Role[];
}) {
  const [search, setSearch] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const sanitizedSearch = sanitizeString(search);
    if (!sanitizedSearch) return sortedUsers;

    const digits = sanitizedSearch.replace(/[^0-9]/g, "");
    const isIstid = /^ist\d+$/i.test(sanitizedSearch) || /^\d+$/.test(sanitizedSearch);

    if (isIstid) {
      const exactMatches = sortedUsers.filter((u) => u.istid.replace(/[^0-9]/g, "") === digits);
      return exactMatches.length > 0
        ? exactMatches
        : sortedUsers.filter((u) => u.istid.replace(/[^0-9]/g, "").startsWith(digits));
    }
    const searchTerms = sanitizedSearch.split(/\s+/).filter(Boolean);

    return sortedUsers.filter((user) => {
      const userDataText = [
        sanitizeString(user.name),
        sanitizeString(user.istid),
        user.istid.replace(/[^0-9]/g, ""),
        user.email.toLowerCase(),
        sanitizeString(user.courses?.join(" ") ?? ""),
        sanitizeString(
          user.memberships?.map((m) => `${m.departmentName} ${m.roleName}`).join(" ") ?? ""
        ),
      ].join(" ");

      const userDataTokens = userDataText.split(/\s+/).filter(Boolean);

      return searchTerms.every((searchTerm) =>
        userDataTokens.some((userDataToken) => userDataToken.startsWith(searchTerm))
      );
    });
  }, [search, sortedUsers]);

  const getAccessLevelForRole = (roleName: string): string => {
    const role = roles.find((r) => r.role_name === roleName);
    return role?.access || UserRole._GUEST;
  };

  const getAccessClass = (accessLevel: string): string => {
    return styles[accessLevel] || styles.guest;
  };

  return (
    <>
      <input
        className={styles.input}
        style={{ marginBottom: 16, width: "100%" }}
        type="text"
        placeholder="Pesquisar por nome, ISTID, email, cargo ou departamento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <p className={styles.emptyMessage}>Nenhum utilizador encontrado.</p>
      ) : (
        <div className={styles.itemsList}>
          {filteredUsers.map((user) => (
            <section key={user.istid} className={styles.item}>
              <Image
                src={user.photo}
                height={200}
                width={200}
                alt={`Foto de ${user.name}`}
                className={styles.userPhoto}
              />
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
                            <span className={styles.roleSeparator}>-</span>
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
