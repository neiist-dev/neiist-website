"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { User, UserRole } from "@/types/user";
import { Membership } from "@/types/memberships";
import styles from "@/styles/components/admin/UsersSearchList.module.css";
import { FaTrash } from "react-icons/fa";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import type { Dictionary } from "@/i18n/dictionaries";

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
  isAdmin = false,
  dict,
}: {
  users: UserWithMemberships[];
  roles: Role[];
  isAdmin?: boolean;
  dict: Dictionary["admin"]["users_management"];
}) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserWithMemberships | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      users
        .filter((u) => !deletedIds.has(u.istid))
        .sort((a, b) => a.name.localeCompare(b.name, "pt")),
    [users, deletedIds]
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

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteUser || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/user/update/${pendingDeleteUser.istid}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || dict.delete_error);

      setDeletedIds((prev) => new Set(prev).add(pendingDeleteUser.istid));
      setPendingDeleteUser(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : dict.delete_error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <input
        className={styles.input}
        style={{ marginBottom: 16, width: "100%" }}
        type="text"
        placeholder={dict.search_placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <p className={styles.emptyMessage}>{dict.empty}</p>
      ) : (
        <div className={styles.itemsList}>
          {filteredUsers.map((user) => (
            <section key={user.istid} className={styles.item}>
              <Image
                src={user.photo}
                height={200}
                width={200}
                alt={`${dict.photo_alt} ${user.name}`}
                className={styles.userPhoto}
              />
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <h4>
                    {user.name} <span className={styles.istid}>({user.istid})</span>
                    {user.isAnonymized && (
                      <span className={`${styles.accessBadge} ${styles.deleted}`}>
                        {dict.account_deleted}
                      </span>
                    )}
                  </h4>
                  {isAdmin && !user.isAnonymized && (
                    <button
                      type="button"
                      className={styles.btnDanger}
                      title={dict.delete_title.replace("{name}", user.name)}
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDeleteUser(user);
                      }}>
                      <FaTrash size={13} />
                    </button>
                  )}
                </div>
                <p className={styles.hideOnMobile}>
                  <strong>{dict.email_label}:</strong>{" "}
                  {user.isAnonymized ? (
                    <span className={styles.deletedText}>{dict.data_deleted}</span>
                  ) : (
                    user.email
                  )}
                </p>
                {user.phone && (
                  <p className={styles.hideOnMobile}>
                    <strong>{dict.phone_label}:</strong> {user.phone}
                  </p>
                )}
                {user.courses?.length > 0 && (
                  <p className={styles.hideOnMobile}>
                    <strong>{dict.courses_label}:</strong> {user.courses.join(", ")}
                  </p>
                )}
                {user.memberships?.length > 0 && (
                  <>
                    <strong>{dict.teams_label}:</strong>
                    <ul className={styles.membershipsList}>
                      {user.memberships.map((membership) => {
                        const accessLevel = getAccessLevelForRole(membership.roleName);
                        return (
                          <li
                            key={
                              membership.id ?? `${membership.departmentName}-${membership.roleName}`
                            }
                            className={styles.membershipItem}>
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

      <ConfirmDialog
        open={pendingDeleteUser !== null}
        message={
          deleteError
            ? `${dict.delete_error}: ${deleteError}`
            : dict.delete_confirm
                .replace("{name}", pendingDeleteUser?.name || "")
                .replace("{istid}", pendingDeleteUser?.istid || "")
        }
        confirmText={dict.confirm_yes}
        cancelText={dict.confirm_cancel}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setPendingDeleteUser(null);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}
