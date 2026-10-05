"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  DataTable,
  ColumnDef,
  DropdownMenu,
  SearchInput,
  Button,
  Badge,
  Checkbox,
  ConfirmDialog,
} from "@neiist/ui";
import { FaPlus, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { FiMoreVertical, FiFileText, FiTrash2, FiRotateCcw } from "react-icons/fi";
import { toast } from "sonner";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Description } from "@/types/memberships";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import {
  deactivateDepartmentAction,
  deleteDepartmentAction,
  reactivateDepartmentAction,
  reorderDepartmentsAction,
} from "@/actions/admin/department";

const DepartmentModal = dynamic(() => import("@/components/management/modals/DepartmentModal"), {
  ssr: false,
});
const DepartmentDetailsModal = dynamic(
  () => import("@/components/management/modals/DepartmentDetailsModal"),
  {
    ssr: false,
  }
);

interface DepartmentItem {
  name: string;
  type: "team" | "admin_body";
  description?: Description;
  active: boolean;
  display_order?: number;
  totalMemberCount?: number;
}

interface DepartmentsTabProps {
  teams: { name: string; description: Description; active: boolean }[];
  adminBodies: { name: string; active: boolean }[];
  departments?: {
    name: string;
    active: boolean;
    department_type?: string;
    display_order?: number;
    totalMemberCount?: number;
  }[];
  canManageDepartments: boolean;
  dict: Dictionary;
}

export default function DepartmentsTab({
  teams: initialTeams,
  adminBodies: initialBodies,
  departments: initialDepartments,
  canManageDepartments,
  dict,
}: DepartmentsTabProps) {
  const router = useRouter();
  const tDict = dict.admin.teams_management;

  const [departments, setDepartments] = useState<DepartmentItem[]>(() => {
    if (initialDepartments && initialDepartments.length > 0) {
      return initialDepartments.map((department) => {
        const teamMatch = initialTeams.find((t) => t.name === department.name);
        return {
          name: department.name,
          type:
            (department.department_type as "team" | "admin_body") ||
            (teamMatch ? "team" : "admin_body"),
          description: teamMatch?.description,
          active: department.active,
          display_order: department.display_order,
          totalMemberCount: department.totalMemberCount || 0,
        };
      });
    }
    return [
      ...initialTeams.map((team) => ({ ...team, type: "team" as const, totalMemberCount: 0 })),
      ...initialBodies.map((body) => ({
        ...body,
        type: "admin_body" as const,
        totalMemberCount: 0,
      })),
    ];
  });

  const [orderedDeptNames, setOrderedDeptNames] = useState<string[]>(() => {
    return [...departments]
      .filter((department) => department.active)
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
      .map((department) => department.name);
  });

  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    dept: DepartmentItem;
    type: "deactivate" | "reactivate" | "delete";
  } | null>(null);

  const moveOrder = useCallback(
    async (deptName: string, direction: "up" | "down") => {
      const currentIndex = orderedDeptNames.indexOf(deptName);
      if (currentIndex === -1) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= orderedDeptNames.length) return;

      const newOrdered = [...orderedDeptNames];
      const [moved] = newOrdered.splice(currentIndex, 1);
      newOrdered.splice(targetIndex, 0, moved);

      // Optimistic update
      setOrderedDeptNames(newOrdered);
      setDepartments((prev) =>
        prev.map((department) => {
          const idx = newOrdered.indexOf(department.name);
          return idx !== -1 ? { ...department, display_order: idx } : department;
        })
      );

      try {
        await reorderDepartmentsAction(newOrdered);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : tDict.reorder_failed);
        // Revert on error
        setOrderedDeptNames(orderedDeptNames);
      }
    },
    [orderedDeptNames, tDict.reorder_failed]
  );

  const sortedAndFilteredDepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = departments.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (!showInactive && !d.active) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;

      const orderA = a.active ? orderedDeptNames.indexOf(a.name) : (a.display_order ?? 999);
      const orderB = b.active ? orderedDeptNames.indexOf(b.name) : (b.display_order ?? 999);

      if (orderA !== -1 && orderB !== -1 && orderA !== orderB) return orderA - orderB;

      return a.name.localeCompare(b.name);
    });
  }, [departments, orderedDeptNames, search, showInactive]);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { dept, type } = pendingAction;

    try {
      if (type === "deactivate") {
        await deactivateDepartmentAction(dept.name);
        toast.success(tDict.dept_deactivated.replace("{name}", dept.name));
        setDepartments((prev) =>
          prev.map((department) =>
            department.name === dept.name ? { ...department, active: false } : department
          )
        );
        setOrderedDeptNames((prev) => prev.filter((name) => name !== dept.name));
      } else if (type === "reactivate") {
        await reactivateDepartmentAction(dept.name);
        toast.success(tDict.dept_reactivated.replace("{name}", dept.name));
        setDepartments((prev) =>
          prev.map((department) =>
            department.name === dept.name ? { ...department, active: true } : department
          )
        );
        setOrderedDeptNames((prev) => [...prev, dept.name]);
      } else if (type === "delete") {
        await deleteDepartmentAction(dept.name);
        toast.success(tDict.dept_deleted.replace("{name}", dept.name));
        setDepartments((prev) => prev.filter((department) => department.name !== dept.name));
        setOrderedDeptNames((prev) => prev.filter((name) => name !== dept.name));
      }
      setSelectedDepartment(null);
      setPendingAction(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tDict.process_error);
    }
  };

  const selectedDeptRank = useMemo(() => {
    if (!selectedDepartment || !selectedDepartment.active) return null;
    const index = orderedDeptNames.indexOf(selectedDepartment.name);
    return index !== -1 ? index + 1 : (selectedDepartment.display_order ?? 0) + 1;
  }, [selectedDepartment, orderedDeptNames]);

  const columns: ColumnDef<DepartmentItem>[] = useMemo(
    () => [
      {
        id: "order",
        header: tDict.order_column,
        width: 120,
        cell: (row) => {
          if (!row.active) return <span className={styles.rankBadge}>—</span>;
          const index = orderedDeptNames.indexOf(row.name);
          const isFirst = index === 0;
          const isLast = index === orderedDeptNames.length - 1;
          const orderDisplay = index !== -1 ? `#${index + 1}` : "—";
          const isFiltered = search.trim() !== "";

          return (
            <div className={styles.orderControls} onClick={(e) => e.stopPropagation()}>
              <span className={styles.rankBadge}>{orderDisplay}</span>
              {canManageDepartments && index !== -1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isFirst || isFiltered}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveOrder(row.name, "up");
                    }}
                    aria-label={tDict.order_up}>
                    <FaArrowUp size={11} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLast || isFiltered}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveOrder(row.name, "down");
                    }}
                    aria-label={tDict.order_down}>
                    <FaArrowDown size={11} />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "name",
        header: tDict.name_column,
        isCardHeader: true,
        cell: (row) => (
          <div className={styles.tableRowNameGroup}>
            <span className={row.active ? styles.tableRowNameActive : styles.tableRowNameInactive}>
              {row.name}
            </span>
            {!row.active && (
              <Badge variant="outline" size="sm">
                {tDict.inactive_badge}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: tDict.type_column,
        cell: (row) => (
          <Badge variant={row.type === "team" ? "primary" : "outline"} size="sm">
            {row.type === "team" ? tDict.type_team : tDict.type_admin_body}
          </Badge>
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
                aria-label={tDict.options_aria}
                onClick={(event) => event.stopPropagation()}>
                <FiMoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={tDict.options_title}>
              <DropdownMenu.Item
                icon={<FiFileText size={14} />}
                onClick={() => setSelectedDepartment(row)}>
                {tDict.view_details}
              </DropdownMenu.Item>
              {canManageDepartments && row.active && (
                <DropdownMenu.Item
                  icon={<FiTrash2 size={14} />}
                  destructive
                  onClick={() => setPendingAction({ dept: row, type: "deactivate" })}>
                  {tDict.deactivate}
                </DropdownMenu.Item>
              )}
              {canManageDepartments && !row.active && (
                <>
                  <DropdownMenu.Item
                    icon={<FiRotateCcw size={14} />}
                    onClick={() => setPendingAction({ dept: row, type: "reactivate" })}>
                    {tDict.reactivate}
                  </DropdownMenu.Item>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    icon={<FiTrash2 size={14} />}
                    destructive
                    onClick={() => setPendingAction({ dept: row, type: "delete" })}>
                    {tDict.delete}
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        ),
      },
    ],
    [orderedDeptNames, canManageDepartments, search, moveOrder, tDict]
  );

  return (
    <section aria-label={tDict.title}>
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={tDict.search_placeholder}
              clearLabel={tDict.clear_search}
            />
          </div>

          <Checkbox
            label={tDict.show_inactive}
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
          />
        </div>

        {canManageDepartments && (
          <div className={styles.actionGroup}>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}>
              <FaPlus className={styles.btnIconLg} />
              {tDict.add_department}
            </Button>
          </div>
        )}
      </div>

      <DataTable
        data={sortedAndFilteredDepts}
        columns={columns}
        getRowId={(row) => row.name}
        onRowClick={(row) => setSelectedDepartment(row)}
        emptyMessage={tDict.empty}
      />

      {isAddModalOpen && (
        <DepartmentModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => router.refresh()}
          dict={dict}
        />
      )}

      {selectedDepartment && (
        <DepartmentDetailsModal
          department={selectedDepartment}
          rank={selectedDeptRank}
          canManage={canManageDepartments}
          onClose={() => setSelectedDepartment(null)}
          onUpdated={(name, desc) => {
            setDepartments((prev) =>
              prev.map((department) =>
                department.name === name ? { ...department, description: desc } : department
              )
            );
          }}
          dict={dict}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          open={!!pendingAction}
          title={
            pendingAction.type === "delete"
              ? tDict.confirm_delete_title
              : pendingAction.type === "deactivate"
                ? (tDict.confirm_deactivate_title || "").replace("{name}", pendingAction.dept.name)
                : (tDict.confirm_reactivate_title || "").replace("{name}", pendingAction.dept.name)
          }
          message={
            pendingAction.type === "delete"
              ? (tDict.confirm_delete_msg || "").replace("{name}", pendingAction.dept.name)
              : pendingAction.type === "deactivate"
                ? (tDict.confirm_deactivate_msg || "").replace("{name}", pendingAction.dept.name)
                : (tDict.confirm_reactivate_msg || "").replace("{name}", pendingAction.dept.name)
          }
          confirmLabel={
            pendingAction.type === "delete"
              ? tDict.delete
              : pendingAction.type === "deactivate"
                ? tDict.deactivate
                : tDict.reactivate
          }
          cancelLabel={tDict.cancel}
          isDestructive={pendingAction.type !== "reactivate"}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </section>
  );
}
