"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabItem } from "@neiist/ui";
import { hasPermission } from "@/lib/security/permissions";
import type { User } from "@/types/user";
import type { Membership, Description } from "@/types/memberships";
import type { RoleItem } from "@/types/roles";
import type { Dictionary } from "@/i18n/dictionaries";
import MembershipsTab from "@/components/management/MembershipsTab";
import DepartmentsTab from "@/components/management/DepartmentsTab";
import RolesTab from "@/components/management/RolesTab";
import UsersTab from "@/components/management/UsersTab";
import PhotosTab from "@/components/management/PhotosTab";
import styles from "@/styles/pages/Management.module.css";

export interface ManagementConsoleProps {
  currentUser: User;
  users: User[];
  totalUsers: number;
  teams: Array<{ name: string; description: Description; active: boolean }>;
  adminBodies: Array<{ name: string; active: boolean }>;
  memberships: Membership[];
  departments: Array<{
    name: string;
    active: boolean;
    department_type?: string;
    display_order?: number;
    memberCount: number;
    totalMemberCount: number;
  }>;
  roles: RoleItem[];
  rolePositions: Record<string, number>;
  academicYears: string[];
  currentAcademicYear: string;
  selectedYear: string;
  coordinatorDepartments: string[];
  initialTab?: string;
  dict: Dictionary;
}

export default function ManagementConsole({
  currentUser,
  users,
  totalUsers,
  teams,
  adminBodies,
  memberships,
  departments,
  roles,
  rolePositions,
  academicYears,
  currentAcademicYear,
  selectedYear,
  coordinatorDepartments,
  initialTab = "memberships",
  dict,
}: ManagementConsoleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const canManageMemberships =
    hasPermission(currentUser, "memberships:write_global") ||
    hasPermission(currentUser, "memberships:write_dept");

  const canManageDepartments =
    hasPermission(currentUser, "departments:write") ||
    hasPermission(currentUser, "departments:delete");

  const canManageRoles =
    hasPermission(currentUser, "roles:write") || hasPermission(currentUser, "roles:delete");

  const canManageUsers = hasPermission(currentUser, "users:write");

  const currentTab = searchParams.get("tab") || initialTab || "memberships";

  const handleTabChange = (newTabId: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("tab", newTabId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const isCoordOnly = !canManageDepartments && !canManageRoles;

  const tabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = [];

    // Memberships tab
    if (
      hasPermission(currentUser, "memberships:read") ||
      hasPermission(currentUser, "memberships:write_dept") ||
      hasPermission(currentUser, "memberships:write_global")
    ) {
      items.push({
        id: "memberships",
        name: isCoordOnly
          ? dict.admin.management.tab_memberships_coord
          : dict.admin.management.tab_memberships_admin,
        content: (
          <MembershipsTab
            initialMemberships={memberships}
            academicYears={academicYears}
            currentAcademicYear={currentAcademicYear}
            selectedYear={selectedYear}
            departments={departments}
            roles={roles}
            rolePositions={rolePositions}
            canManageMemberships={canManageMemberships}
            coordinatorDepartments={coordinatorDepartments}
            dict={dict}
          />
        ),
      });
    }

    // Departments tab
    if (
      hasPermission(currentUser, "departments:read") ||
      hasPermission(currentUser, "departments:write")
    ) {
      items.push({
        id: "departments",
        name: dict.admin.management.tab_departments,
        content: (
          <DepartmentsTab
            teams={teams}
            adminBodies={adminBodies}
            departments={departments}
            canManageDepartments={canManageDepartments}
            dict={dict}
          />
        ),
      });
    }

    // Roles tab
    if (hasPermission(currentUser, "roles:read") || hasPermission(currentUser, "roles:write")) {
      items.push({
        id: "roles",
        name: dict.admin.management.tab_roles,
        content: (
          <RolesTab
            departments={departments}
            initialRoles={roles}
            initialRolePositions={rolePositions}
            academicYears={academicYears}
            currentAcademicYear={currentAcademicYear}
            selectedYear={selectedYear}
            memberships={memberships}
            canManageRoles={canManageRoles}
            dict={dict}
          />
        ),
      });
    }

    // Users tab
    if (hasPermission(currentUser, "users:read") || hasPermission(currentUser, "users:write")) {
      items.push({
        id: "users",
        name: dict.admin.management.tab_users,
        content: (
          <UsersTab
            users={users}
            totalUsers={totalUsers}
            canManageUsers={canManageUsers}
            dict={dict}
          />
        ),
      });
    }

    // Photos tab
    if (
      hasPermission(currentUser, "photos:read") ||
      hasPermission(currentUser, "photos:write_dept") ||
      hasPermission(currentUser, "photos:write_global")
    ) {
      items.push({
        id: "photos",
        name: dict.admin.management.tab_photos,
        content: (
          <PhotosTab
            memberships={memberships}
            departments={departments}
            academicYears={academicYears}
            currentAcademicYear={currentAcademicYear}
            dict={dict}
          />
        ),
      });
    }

    return items;
  }, [
    currentUser,
    memberships,
    academicYears,
    currentAcademicYear,
    selectedYear,
    users,
    departments,
    roles,
    rolePositions,
    canManageMemberships,
    coordinatorDepartments,
    dict,
    teams,
    adminBodies,
    canManageDepartments,
    canManageRoles,
    totalUsers,
    canManageUsers,
    isCoordOnly,
  ]);

  const activeTabId = tabs.some((t) => t.id === currentTab)
    ? currentTab
    : tabs[0]?.id || "memberships";

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{dict.admin.management.title}</h1>
        <p className={styles.subtitle}>
          {!isCoordOnly
            ? dict.admin.management.subtitle_admin
            : dict.admin.management.subtitle_coord}
        </p>
      </header>
      <Tabs tabs={tabs} value={activeTabId} onChange={handleTabChange} />
    </main>
  );
}
