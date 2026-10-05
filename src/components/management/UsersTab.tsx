"use client";

import React, { useState, useCallback } from "react";
import { User } from "@/types/user";
import { DetailCard, DropdownMenu, Button, ConfirmDialog, SearchInput } from "@neiist/ui";
import { useServerSearch } from "@/hooks/useServerSearch";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { useUser } from "@/context/UserContext";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { toast } from "sonner";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import userStyles from "@/styles/components/management/UsersTab.module.css";
import type { Dictionary } from "@/i18n/dictionaries";
import { deleteUserAction } from "@/actions/admin/user";

interface UsersTabProps {
  users: User[];
  totalUsers?: number;
  canManageUsers?: boolean;
  dict: Dictionary;
}

export default function UsersTab({ users, totalUsers, dict }: UsersTabProps) {
  const { hasPermission } = useUser();
  const [pendingDeleteUser, setPendingDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const uDict = dict.admin.users_management;
  const canDeleteUser = hasPermission("users:delete");

  const {
    results: userList,
    query: search,
    setQuery: setSearch,
    isSearching: isLoading,
    page,
    setPage,
    total,
    totalPages,
    setResults: setUserList,
    setTotal,
  } = useServerSearch<User>({
    initialData: users,
    initialTotal: totalUsers ?? users.length,
    initialPage: 1,
    pageSize: 50,
    fetcher: useCallback(async (query: string, targetPage: number, signal: AbortSignal) => {
      const res = await fetch(
        `/api/admin/users?page=${targetPage}&limit=50&search=${encodeURIComponent(query)}`,
        { signal }
      );
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      return {
        data: data.users || [],
        total: data.total,
        totalPages: data.totalPages,
      };
    }, []),
  });

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || isLoading) return;
    setPage(newPage);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteUser || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUserAction(pendingDeleteUser.istid);
      setUserList((prev) => prev.filter((user) => user.istid !== pendingDeleteUser.istid));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success(uDict.data_deleted || "User deleted successfully");
      setPendingDeleteUser(null);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : uDict.delete_error || "Failed to delete user"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const startIdx = total === 0 ? 0 : (page - 1) * 50 + 1;
  const endIdx = Math.min(page * 50, total);

  return (
    <section aria-label={uDict.title}>
      <div className={styles.toolbar}>
        <div className={styles.searchInputWrapper}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={uDict.search_placeholder}
            clearLabel={uDict.clear_search}
          />
        </div>
      </div>

      {userList.length === 0 && !isLoading ? (
        <div className={styles.emptyState}>{uDict.empty}</div>
      ) : (
        <>
          <div className={`${userStyles.usersGrid} ${isLoading ? userStyles.loading : ""}`.trim()}>
            {userList.map((user) => (
              <DetailCard
                key={user.istid}
                title={user.name}
                identifier={user.istid}
                avatar={<MemberAvatar name={user.name} photo={user.photo} size="md" />}
                actions={
                  canDeleteUser ? (
                    <DropdownMenu>
                      <DropdownMenu.Trigger>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label={uDict.options_aria}>
                          <FiMoreVertical size={18} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" mobileTitle={uDict.options_title}>
                        <DropdownMenu.Item
                          icon={<FiTrash2 size={15} />}
                          destructive
                          onClick={() => setPendingDeleteUser(user)}>
                          {uDict.delete_account}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  ) : undefined
                }
                metadata={[
                  { label: uDict.email_label, value: user.email },
                  ...(user.phone ? [{ label: uDict.phone_label, value: user.phone }] : []),
                  {
                    label: uDict.courses_label,
                    value: user.courses && user.courses.length > 0 ? user.courses.join(", ") : "—",
                  },
                  {
                    label: uDict.teams_label,
                    value:
                      user.teams && user.teams.length > 0 ? (
                        <span className={userStyles.roleTag}>
                          <strong>{user.teams.join(", ")}</strong>
                          {user.positionName && (
                            <>
                              <span>-</span>
                              <span>{user.positionName}</span>
                            </>
                          )}
                        </span>
                      ) : (
                        "—"
                      ),
                  },
                ]}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={userStyles.paginationBar}>
              <span>
                {(uDict.pagination_info || "{start}–{end} of {total} users")
                  .replace("{start}", String(startIdx))
                  .replace("{end}", String(endIdx))
                  .replace("{total}", String(total))}
              </span>
              <div className={userStyles.paginationActions}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(page - 1)}>
                  {uDict.prev_page}
                </Button>
                <span className={userStyles.pageIndicator}>
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}>
                  {uDict.next_page}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {pendingDeleteUser && (
        <ConfirmDialog
          open={!!pendingDeleteUser}
          title={(uDict.delete_title || "Delete user {name}").replace(
            "{name}",
            pendingDeleteUser.name
          )}
          message={(uDict.delete_confirm || "")
            .replace("{name}", pendingDeleteUser.name)
            .replace("{istid}", pendingDeleteUser.istid)}
          confirmLabel={uDict.delete_account}
          cancelLabel={uDict.confirm_cancel}
          isDestructive
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteUser(null)}
        />
      )}
    </section>
  );
}
