"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  DataTable,
  ColumnDef,
  SearchInput,
  Select,
  Button,
  Badge,
  ConfirmDialog,
  Checkbox,
  DropdownMenu,
} from "@neiist/ui";
import { FaPlus, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { FiMoreVertical, FiTrash2, FiSliders, FiRotateCcw } from "react-icons/fi";
import { toast } from "sonner";
import { UserRole, RoleItem, mapAccessLabelToUserRole } from "@/types/roles";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Membership } from "@/types/memberships";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import { removeRoleAction, reorderRoleHierarchyAction } from "@/actions/admin/roles";

const AddRoleModal = dynamic(() => import("@/components/management/modals/AddRoleModal"), {
  ssr: false,
});
const RolePermissionsModal = dynamic(
  () => import("@/components/management/modals/RolePermissionsModal"),
  {
    ssr: false,
  }
);

interface Department {
  name: string;
  active: boolean;
  department_type?: string;
}

interface RolesTabProps {
  departments: Department[];
  initialRoles: RoleItem[];
  initialRolePositions?: Record<string, number>;
  academicYears?: string[];
  currentAcademicYear?: string;
  selectedYear?: string;
  memberships?: Membership[];
  canManageRoles: boolean;
  dict: Dictionary;
}

export default function RolesTab({
  departments,
  initialRoles,
  initialRolePositions = {},
  canManageRoles,
  dict,
}: RolesTabProps) {
  const router = useRouter();
  const rDict = dict.admin.roles_management;

  const [allRoles, setAllRoles] = useState<RoleItem[]>(initialRoles);
  const [rolePositions, setRolePositions] = useState<Record<string, number>>(initialRolePositions);
  const [selectedDept, setSelectedDept] = useState<string>(departments[0]?.name || "");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [permsTargetRole, setPermsTargetRole] = useState<RoleItem | null>(null);

  // Confirm delete / deactivate
  const [pendingRemove, setPendingRemove] = useState<{
    role: RoleItem;
    permanent: boolean;
  } | null>(null);

  const activeDepartmentRoles = useMemo(() => {
    return allRoles.filter((role) => (role.department_name || role.department) === selectedDept);
  }, [allRoles, selectedDept]);

  const sortedAndFilteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = activeDepartmentRoles.filter((role) => {
      if (q && !role.role_name.toLowerCase().includes(q)) return false;
      if (!showInactive && !role.active) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const posA = rolePositions[`${selectedDept}-${a.role_name}`] ?? 999;
      const posB = rolePositions[`${selectedDept}-${b.role_name}`] ?? 999;
      if (posA !== posB) return posA - posB;
      return a.role_name.localeCompare(b.role_name);
    });
  }, [activeDepartmentRoles, rolePositions, selectedDept, search, showInactive]);

  const moveHierarchy = useCallback(
    async (roleName: string, direction: "up" | "down") => {
      const activeRoles = activeDepartmentRoles
        .filter((role) => role.active)
        .sort((a, b) => {
          const posA = rolePositions[`${selectedDept}-${a.role_name}`] ?? 999;
          const posB = rolePositions[`${selectedDept}-${b.role_name}`] ?? 999;
          if (posA !== posB) return posA - posB;
          return a.role_name.localeCompare(b.role_name);
        });

      const currentIndex = activeRoles.findIndex((role) => role.role_name === roleName);
      if (currentIndex === -1) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= activeRoles.length) return;

      const targetRole = activeRoles[targetIndex];

      const currentPos = rolePositions[`${selectedDept}-${roleName}`] ?? currentIndex + 1;
      const targetPos = rolePositions[`${selectedDept}-${targetRole.role_name}`] ?? targetIndex + 1;

      const reorderedList = [...activeRoles];
      const [moved] = reorderedList.splice(currentIndex, 1);
      reorderedList.splice(targetIndex, 0, moved);

      // Swap positions
      const newPositions = {
        ...rolePositions,
        [`${selectedDept}-${roleName}`]: targetPos,
        [`${selectedDept}-${targetRole.role_name}`]: currentPos,
      };

      setRolePositions(newPositions);

      try {
        await reorderRoleHierarchyAction({
          departmentName: selectedDept,
          roles: reorderedList.map((r) => r.role_name),
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : rDict.reorder_failed);
        setRolePositions(rolePositions);
      }
    },
    [activeDepartmentRoles, rolePositions, selectedDept, rDict.reorder_failed]
  );

  const handleRemoveConfirm = async () => {
    if (!pendingRemove) return;
    const { role, permanent } = pendingRemove;

    try {
      await removeRoleAction({
        departmentName: selectedDept,
        roleName: role.role_name,
        permanent,
      });
      if (permanent) {
        setAllRoles((prev) =>
          prev.filter(
            (role) =>
              !(
                role.role_name === role.role_name &&
                (role.department_name || role.department) === selectedDept
              )
          )
        );
        toast.success(rDict.role_deleted.replace("{role}", role.role_name));
      } else {
        setAllRoles((prev) =>
          prev.map((role) =>
            role.role_name === role.role_name &&
            (role.department_name || role.department) === selectedDept
              ? { ...role, active: false }
              : role
          )
        );
        toast.success(rDict.role_deactivated.replace("{role}", role.role_name));
      }
      setPendingRemove(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : rDict.errors.remove_role);
    }
  };

  const columns: ColumnDef<RoleItem>[] = useMemo(
    () => [
      {
        id: "order",
        header: rDict.order_column,
        width: 120,
        cell: (row) => {
          if (!row.active) return <span className={styles.rankBadge}>—</span>;
          const pos = rolePositions[`${selectedDept}-${row.role_name}`] ?? "—";
          const activeRoles = sortedAndFilteredRoles.filter((role) => role.active);
          const index = activeRoles.findIndex((role) => role.role_name === row.role_name);
          const isFirst = index === 0;
          const isLast = index === activeRoles.length - 1;
          const isFiltered = search.trim() !== "";

          return (
            <div className={styles.orderControls} onClick={(e) => e.stopPropagation()}>
              <span className={styles.rankBadge}>#{pos}</span>
              {canManageRoles && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isFirst || isFiltered}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveHierarchy(row.role_name, "up");
                    }}
                    aria-label={rDict.order_up}>
                    <FaArrowUp size={11} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLast || isFiltered}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveHierarchy(row.role_name, "down");
                    }}
                    aria-label={rDict.order_down}>
                    <FaArrowDown size={11} />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "role_name",
        header: rDict.role_column,
        isCardHeader: true,
        cell: (row) => (
          <div className={styles.tableRowNameGroup}>
            <span className={row.active ? styles.tableRowNameActive : styles.tableRowNameInactive}>
              {row.role_name}
            </span>
            {!row.active && (
              <Badge variant="outline" size="sm">
                {rDict.inactive_badge}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "access_level",
        header: rDict.access_level_column,
        cell: (row) => {
          const userRole = mapAccessLabelToUserRole(row.access_label, row.active);
          const variant =
            userRole === UserRole._ADMIN
              ? "primary"
              : userRole === UserRole._COORDINATOR
                ? "secondary"
                : "outline";
          return (
            <Badge variant={variant} size="sm">
              {row.access_label ? row.access_label.toUpperCase() : "MEMBER"}
            </Badge>
          );
        },
      },
      {
        id: "permissions_count",
        header: rDict.permissions_column,
        cell: (row) => (
          <span className={styles.metaText}>
            {(rDict.permissions_count || "{count} permissions").replace(
              "{count}",
              String(row.permissions?.length || 0)
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        width: 50,
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <button
                type="button"
                className={styles.actionBtn}
                aria-label={rDict.options_aria}
                onClick={(event) => event.stopPropagation()}>
                <FiMoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={rDict.options_title}>
              <DropdownMenu.Item
                icon={<FiSliders size={14} />}
                onClick={() => setPermsTargetRole(row)}>
                {rDict.manage_permissions}
              </DropdownMenu.Item>
              {canManageRoles && row.active && (
                <DropdownMenu.Item
                  icon={<FiTrash2 size={14} />}
                  destructive
                  onClick={() => setPendingRemove({ role: row, permanent: false })}>
                  {rDict.deactivate_role}
                </DropdownMenu.Item>
              )}
              {canManageRoles && !row.active && (
                <>
                  <DropdownMenu.Item
                    icon={<FiRotateCcw size={14} />}
                    onClick={() => {
                      toast.info(rDict.reactivate_hint);
                    }}>
                    {rDict.reactivate_role}
                  </DropdownMenu.Item>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    icon={<FiTrash2 size={14} />}
                    destructive
                    onClick={() => setPendingRemove({ role: row, permanent: true })}>
                    {rDict.delete_role}
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        ),
      },
    ],
    [
      rolePositions,
      sortedAndFilteredRoles,
      selectedDept,
      search,
      canManageRoles,
      moveHierarchy,
      rDict,
    ]
  );

  return (
    <section aria-label={rDict.title}>
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={rDict.search_placeholder}
              clearLabel={rDict.clear_search}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select
              options={departments.map((department) => ({
                label: department.name,
                value: department.name,
              }))}
              value={selectedDept}
              onChange={setSelectedDept}
              placeholder={rDict.select_department}
            />
          </div>

          <Checkbox
            label={rDict.show_inactive}
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
          />
        </div>

        {canManageRoles && (
          <div className={styles.actionGroup}>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}>
              <FaPlus className={styles.btnIconLg} />
              {rDict.add_role}
            </Button>
          </div>
        )}
      </div>

      <DataTable
        data={sortedAndFilteredRoles}
        columns={columns}
        getRowId={(row) => `${selectedDept}-${row.role_name}`}
        onRowClick={(row) => setPermsTargetRole(row)}
        emptyMessage={rDict.empty_all}
      />

      {isAddModalOpen && (
        <AddRoleModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(deptName, roleName, permissions) => {
            setAllRoles((prev) => [
              ...prev,
              {
                role_name: roleName,
                department_name: deptName,
                active: true,
                permissions,
                access_label: null,
              },
            ]);
            router.refresh();
          }}
          departments={departments}
          defaultDept={selectedDept}
          dict={dict}
        />
      )}

      {permsTargetRole && (
        <RolePermissionsModal
          role={permsTargetRole}
          departmentName={selectedDept}
          canManage={canManageRoles}
          onClose={() => setPermsTargetRole(null)}
          onSaved={(deptName, roleName, newPermissions, accessLabel) => {
            setAllRoles((prev) =>
              prev.map((role) =>
                role.role_name === roleName &&
                (role.department_name || role.department) === deptName
                  ? {
                      ...role,
                      permissions: newPermissions,
                      access_label: accessLabel as "admin" | "coordinator" | null,
                    }
                  : role
              )
            );
          }}
          dict={dict}
        />
      )}

      {pendingRemove && (
        <ConfirmDialog
          open={!!pendingRemove}
          title={
            pendingRemove.permanent
              ? rDict.delete_role
              : `${rDict.deactivate_role}: ${pendingRemove.role.role_name}`
          }
          message={
            pendingRemove.permanent
              ? (rDict.confirm_remove || "")
                  .replace("{role}", pendingRemove.role.role_name)
                  .replace("{department}", selectedDept)
              : `${rDict.deactivate_role} "${pendingRemove.role.role_name}" (${selectedDept})?`
          }
          confirmLabel={pendingRemove.permanent ? rDict.remove : rDict.deactivate_role}
          cancelLabel={rDict.cancel}
          isDestructive
          onConfirm={handleRemoveConfirm}
          onCancel={() => setPendingRemove(null)}
        />
      )}
    </section>
  );
}
