"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DataTable,
  ColumnDef,
  SearchInput,
  Select,
  Button,
  Badge,
  ConfirmDialog,
  DropdownMenu,
} from "@neiist/ui";
import MemberAvatar from "@/components/layout/MemberAvatar";
import { useSearch } from "@/hooks/useSearch";
import { FaPlus } from "react-icons/fa";
import { FiMoreVertical, FiCalendar, FiTrash2, FiFileText, FiCamera } from "react-icons/fi";
import { toast } from "sonner";
import { ROLE_HIERARCHY, RoleItem, mapAccessLabelToUserRole } from "@/types/roles";
import {
  compareMembershipsByHierarchy,
  compareMembershipsByActiveAndHierarchy,
} from "@/utils/membershipSortUtils";
import type { Membership } from "@/types/memberships";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/management/ManagementTabs.module.css";
import { concludeMembershipAction, deleteMembershipAction } from "@/actions/admin/memberships";

const AddMembershipModal = dynamic(
  () => import("@/components/management/modals/AddMembershipModal"),
  {
    ssr: false,
  }
);
const MemberDetailModal = dynamic(
  () => import("@/components/management/modals/MemberDetailModal"),
  {
    ssr: false,
  }
);

interface Department {
  name: string;
  active: boolean;
  department_type?: string;
  display_order?: number;
}

interface MembershipsTabProps {
  initialMemberships: Membership[];
  academicYears: string[];
  currentAcademicYear: string;
  selectedYear?: string;
  departments: Department[];
  roles?: RoleItem[];
  rolePositions?: Record<string, number>;
  canManageMemberships: boolean;
  canManagePhotos?: boolean;
  coordinatorDepartments: string[];
  dict: Dictionary;
}

export default function MembershipsTab({
  initialMemberships,
  academicYears,
  currentAcademicYear,
  selectedYear: propSelectedYear,
  departments,
  roles = [],
  rolePositions: propRolePositions,
  canManageMemberships,
  canManagePhotos = false,
  coordinatorDepartments,
  dict,
}: MembershipsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedYear = propSelectedYear || currentAcademicYear;
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    membership: Membership;
    action: "conclude" | "delete";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingPhotoIstid, setEditingPhotoIstid] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const mDict = dict.admin.memberships_management;

  const handlePhotoUpdated = (userNumber: string, newPhotoUrl: string) => {
    setMemberships((prev) =>
      prev.map((member) =>
        member.userNumber === userNumber ? { ...member, userPhoto: newPhotoUrl } : member
      )
    );
    if (selectedMembership && selectedMembership.userNumber === userNumber) {
      setSelectedMembership((prev) => (prev ? { ...prev, userPhoto: newPhotoUrl } : null));
    }
  };

  const triggerPhotoUpload = (istid: string) => {
    setEditingPhotoIstid(istid);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPhotoIstid) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`/api/user/update/${editingPhotoIstid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: base64 }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || mDict.photo_error || "Failed to update photo");
        }

        const newPhotoUrl = `/api/user/photo/${editingPhotoIstid}?custom&t=${Date.now()}`;
        handlePhotoUpdated(editingPhotoIstid, newPhotoUrl);
        toast.success(mDict.photo_updated || "Photo updated successfully");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : mDict.photo_error || "Failed to update photo"
        );
      } finally {
        setIsUploadingPhoto(false);
        setEditingPhotoIstid(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("year", newYear);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const allowedDepartments = useMemo(() => {
    const isCurrent = selectedYear === currentAcademicYear;
    const activeDeptNamesInYear = new Set(memberships.map((m) => m.departmentName));
    const yearDepts = departments
      .filter(
        (department) =>
          activeDeptNamesInYear.has(department.name) || (isCurrent && department.active)
      )
      .sort((a, b) => {
        const orderA = a.display_order ?? 999;
        const orderB = b.display_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });

    if (coordinatorDepartments.length === 0) return yearDepts;
    return yearDepts.filter((department) => coordinatorDepartments.includes(department.name));
  }, [departments, selectedYear, currentAcademicYear, memberships, coordinatorDepartments]);

  useEffect(() => {
    if (
      selectedDept &&
      !allowedDepartments.some((department) => department.name === selectedDept)
    ) {
      setSelectedDept("");
    }
  }, [allowedDepartments, selectedDept]);

  const deptOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    departments.forEach((department) => {
      map.set(department.name, department.display_order ?? 999);
    });
    return map;
  }, [departments]);

  const rolePositionMap = useMemo(() => {
    const map = new Map<string, number>();
    if (propRolePositions) {
      Object.entries(propRolePositions).forEach(([k, v]) => map.set(k, v));
    }
    roles.forEach((role) => {
      const dept = role.department_name || role.department;
      if (dept && !map.has(`${dept}-${role.role_name}`)) {
        map.set(`${dept}-${role.role_name}`, 999);
      }
    });
    return map;
  }, [propRolePositions, roles]);

  const roleTierMap = useMemo(() => {
    const map = new Map<string, number>();
    roles.forEach((role) => {
      const dept = role.department_name || role.department;
      if (!dept) return;
      const key = `${dept}-${role.role_name}`;
      const userRole = mapAccessLabelToUserRole(role.access_label, role.active);
      const tierWeight = ROLE_HIERARCHY[userRole] ?? 0;
      const permCount = role.permissions?.length ?? 0;
      map.set(key, tierWeight * 1000 + permCount);
    });
    return map;
  }, [roles]);

  const sortedMemberships = useMemo(() => {
    const ctx = { deptOrderMap, rolePositionMap, roleTierMap };
    return [...memberships].sort((a, b) => {
      if (selectedDept) {
        return compareMembershipsByActiveAndHierarchy(a, b, ctx);
      }
      return compareMembershipsByHierarchy(a, b, ctx);
    });
  }, [memberships, selectedDept, deptOrderMap, roleTierMap, rolePositionMap]);

  const deptFilteredMemberships = useMemo(() => {
    if (!selectedDept) return sortedMemberships;
    return sortedMemberships.filter((membership) => membership.departmentName === selectedDept);
  }, [sortedMemberships, selectedDept]);

  const {
    results: filteredMemberships,
    query: search,
    setQuery: setSearch,
  } = useSearch({
    data: deptFilteredMemberships,
    fields: ["userName", "userNumber", "departmentName", "roleName"],
    returnAllWhenEmpty: true,
  });

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { membership, action } = pendingAction;

    try {
      if (action === "conclude") {
        await concludeMembershipAction({
          membershipId: membership.id,
          userNumber: membership.userNumber,
          departmentName: membership.departmentName,
          roleName: membership.roleName,
          fromDate: membership.startDate,
        });
        toast.success(mDict.conclude_success);
        setMemberships((prev) =>
          prev.map((membership) =>
            membership.id === membership.id
              ? { ...membership, isActive: false, endDate: new Date().toISOString().split("T")[0] }
              : membership
          )
        );
      } else {
        await deleteMembershipAction({
          membershipId: membership.id,
          userNumber: membership.userNumber,
          departmentName: membership.departmentName,
          roleName: membership.roleName,
          fromDate: membership.startDate,
        });
        toast.success(mDict.delete_success);
        setMemberships((prev) => prev.filter((membership) => membership.id !== membership.id));
      }
      setSelectedMembership(null);
      setPendingAction(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : mDict.process_error);
    }
  };

  const columns: ColumnDef<Membership>[] = useMemo(
    () => [
      {
        id: "user",
        header: mDict.member_column,
        cell: (row) => (
          <div className={styles.tableUserCell}>
            <MemberAvatar name={row.userName} photo={row.userPhoto} size="sm" />
            <div className={styles.tableUserInfo}>
              <span className={styles.tableUserName}>{row.userName}</span>
              <span className={styles.tableUserIstId}>{row.userNumber}</span>
            </div>
          </div>
        ),
      },
      {
        id: "department",
        header: mDict.department_column,
        cell: (row) => (
          <Badge variant="primary" size="sm">
            {row.departmentName}
          </Badge>
        ),
      },
      {
        id: "role",
        header: mDict.role_column,
        cell: (row) => <span className={styles.tableRoleName}>{row.roleName}</span>,
      },
      {
        id: "status",
        header: mDict.status_column,
        cell: (row) => (
          <Badge variant={row.isActive ? "primary" : "outline"} size="sm">
            {row.isActive ? mDict.active_badge : mDict.concluded_badge}
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
                aria-label={mDict.options_aria}
                onClick={(event) => event.stopPropagation()}>
                <FiMoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={mDict.options_title}>
              <DropdownMenu.Item
                icon={<FiFileText size={14} />}
                onClick={() => setSelectedMembership(row)}>
                {mDict.view_details}
              </DropdownMenu.Item>
              {canManagePhotos && (
                <DropdownMenu.Item
                  icon={<FiCamera size={14} />}
                  disabled={isUploadingPhoto}
                  onClick={() => triggerPhotoUpload(row.userNumber)}>
                  {mDict.change_photo}
                </DropdownMenu.Item>
              )}
              {canManageMemberships && row.isActive && (
                <DropdownMenu.Item
                  icon={<FiCalendar size={14} />}
                  onClick={() => setPendingAction({ membership: row, action: "conclude" })}>
                  {mDict.conclude_mandate}
                </DropdownMenu.Item>
              )}
              {canManageMemberships && (
                <>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    icon={<FiTrash2 size={14} />}
                    destructive
                    onClick={() => setPendingAction({ membership: row, action: "delete" })}>
                    {mDict.delete_mandate}
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        ),
      },
    ],
    [canManageMemberships, canManagePhotos, isUploadingPhoto, mDict]
  );

  return (
    <section aria-label={mDict.title}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className={styles.hiddenFileInput}
        onChange={handlePhotoFileChange}
      />
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <div className={styles.searchInputWrapper}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={mDict.search_placeholder}
              clearLabel={mDict.clear_search}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select
              options={academicYears.map((year) => ({ label: year, value: year }))}
              value={selectedYear}
              onChange={handleYearChange}
              placeholder={mDict.select_year}
            />
          </div>

          <div className={styles.selectWrapper}>
            <Select
              options={[
                { label: mDict.all_departments, value: "" },
                ...allowedDepartments.map((department) => ({
                  label: department.name,
                  value: department.name,
                })),
              ]}
              value={selectedDept}
              onChange={setSelectedDept}
              placeholder={mDict.all_departments}
            />
          </div>
        </div>

        {canManageMemberships && (
          <div className={styles.actionGroup}>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}>
              <FaPlus className={styles.btnIconLg} />
              {mDict.add_mandate_button}
            </Button>
          </div>
        )}
      </div>

      <DataTable
        data={filteredMemberships}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={(row) => setSelectedMembership(row)}
        emptyMessage={mDict.empty}
      />

      {isAddModalOpen && (
        <AddMembershipModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => router.refresh()}
          allowedDepartments={allowedDepartments}
          roles={roles}
          dict={dict}
        />
      )}

      {selectedMembership && (
        <MemberDetailModal
          membership={selectedMembership}
          selectedYear={selectedYear}
          canManage={canManageMemberships}
          canManagePhotos={canManagePhotos}
          onPhotoUpdated={handlePhotoUpdated}
          onClose={() => setSelectedMembership(null)}
          onConclude={(membership) =>
            setPendingAction({ membership: membership, action: "conclude" })
          }
          onDelete={(membership) => setPendingAction({ membership: membership, action: "delete" })}
          dict={dict}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          open={!!pendingAction}
          title={
            pendingAction.action === "delete"
              ? mDict.confirm_delete_title
              : mDict.confirm_conclude_title
          }
          message={
            pendingAction.action === "delete"
              ? mDict.confirm_delete_msg
              : mDict.confirm_conclude_msg
          }
          confirmLabel={
            pendingAction.action === "delete" ? mDict.delete_mandate : mDict.conclude_mandate
          }
          cancelLabel={mDict.confirm_cancel}
          isDestructive={pendingAction.action === "delete"}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </section>
  );
}
