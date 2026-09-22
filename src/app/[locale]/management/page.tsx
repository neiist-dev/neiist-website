import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { Membership } from "@/types/memberships";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import {
  getAllTeams,
  getAllAdminBodies,
  getAllDepartments,
  getAcademicYears,
  getMembershipsForAcademicYear,
  getAllDepartmentRoles,
  getDepartmentRoleOrders,
  getDepartmentMemberCounts,
} from "@/lib/db/repositories/team.repository";
import { getCurrentAcademicYear } from "@/utils/academicYearUtils";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";
import ManagementConsole from "@/components/management/ManagementConsole";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ tab?: string; year?: string }>;
}

async function ManagementContent({ params, searchParams }: PageProps) {
  const { user } = await requireUser();
  const canAccessManagement =
    hasPermission(user, "departments:read") ||
    hasPermission(user, "roles:read") ||
    hasPermission(user, "memberships:read") ||
    hasPermission(user, "memberships:write_dept") ||
    hasPermission(user, "memberships:write_global") ||
    hasPermission(user, "photos:read") ||
    hasPermission(user, "photos:write_dept") ||
    hasPermission(user, "photos:write_global") ||
    hasPermission(user, "users:read");

  if (!canAccessManagement) redirect("/unauthorized");

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const { tab, year } = await searchParams;

  const currentAcademicYear = getCurrentAcademicYear();
  const dbYears = await getAcademicYears();
  const academicYears = dbYears.length > 0 ? dbYears : [currentAcademicYear];
  const selectedYear = year && academicYears.includes(year) ? year : currentAcademicYear;

  const [users, teams, adminBodies, departments, memberships, validRoles, lifetimeMemberCounts]: [
    Awaited<ReturnType<typeof getAllUsers>>,
    Awaited<ReturnType<typeof getAllTeams>>,
    Awaited<ReturnType<typeof getAllAdminBodies>>,
    Awaited<ReturnType<typeof getAllDepartments>>,
    Membership[],
    Awaited<ReturnType<typeof getAllDepartmentRoles>>,
    Awaited<ReturnType<typeof getDepartmentMemberCounts>>,
  ] = await Promise.all([
    getAllUsers(),
    getAllTeams(),
    getAllAdminBodies(),
    getAllDepartments(),
    getMembershipsForAcademicYear(selectedYear),
    getAllDepartmentRoles(),
    getDepartmentMemberCounts(),
  ]);

  const isAdmin =
    hasPermission(user, "memberships:write_global") ||
    hasPermission(user, "departments:write") ||
    hasPermission(user, "roles:write");
  const coordinatorDepartments = isAdmin
    ? departments.map((department) => department.name)
    : Array.from(
        new Set(
          memberships
            .filter((member) => member.userNumber === user.istid && member.isActive)
            .filter((member) => {
              const validRole = validRoles.find(
                (validRole) =>
                  validRole.department_name === member.departmentName &&
                  validRole.role_name === member.roleName &&
                  validRole.active &&
                  validRole.permissions?.some(
                    (permission) =>
                      permission === "memberships:write_dept" || permission === "departments:read"
                  )
              );
              return !!validRole;
            })
            .map((member) => member.departmentName)
        )
      );

  const roleItems = validRoles.map((role) => ({
    role_name: role.role_name,
    active: role.active,
    department: role.department_name,
    permissions: role.permissions,
    access_label: role.access_label,
  }));

  const departmentsWithCounts = departments.map((department) => ({
    ...department,
    memberCount: memberships.filter((member) => member.departmentName === department.name).length,
    totalMemberCount: lifetimeMemberCounts[department.name] || 0,
  }));

  const roleOrders = await getDepartmentRoleOrders(departments.map((d) => d.name));
  const rolePositionsMap: Record<string, number> = {};
  roleOrders.forEach((roleOrder) => {
    rolePositionsMap[`${roleOrder.department_name}-${roleOrder.role_name}`] = roleOrder.position;
  });

  return (
    <ManagementConsole
      currentUser={user}
      users={users.slice(0, 50)}
      totalUsers={users.length}
      teams={teams}
      adminBodies={adminBodies}
      memberships={memberships}
      departments={departmentsWithCounts}
      roles={roleItems}
      rolePositions={rolePositionsMap}
      academicYears={academicYears}
      currentAcademicYear={currentAcademicYear}
      selectedYear={selectedYear}
      coordinatorDepartments={coordinatorDepartments}
      initialTab={tab}
      dict={dict}
    />
  );
}

export default function ManagementPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <ManagementContent {...props} />
    </Suspense>
  );
}
