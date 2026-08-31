import { Suspense } from "react";
import CoordinatorTeamManagementSearch from "@/components/team-management/CoordinatorTeamManagementSearch";
import { UserRole } from "@/types/user";
import { Membership } from "@/types/memberships";
import { requireRoles } from "@/lib/auth";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import {
  getAllMemberships,
  getAllValidDepartmentRoles,
} from "@/lib/db/repositories/team.repository";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface Role {
  department_name: string;
  role_name: string;
  access: string;
  active: boolean;
}

interface PageProps {
  params: LocaleParams;
}

async function TeamManagementContent({ params }: PageProps) {
  const { user } = await requireRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  const istid = user.istid;

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).coordinator_management;

  const [users, memberships] = (await Promise.all([getAllUsers(), getAllMemberships()])) as [
    Awaited<ReturnType<typeof getAllUsers>>,
    Membership[],
  ];
  const validRoles: Role[] = await getAllValidDepartmentRoles();
  const userMemberships = memberships.filter(
    (membership) => membership.userNumber === istid && membership.isActive
  );

  const coordinatorTeams = userMemberships
    .filter((membership) => {
      const validRole = validRoles.find(
        (role) =>
          role.department_name === membership.departmentName &&
          role.role_name === membership.roleName &&
          (role.access === UserRole._COORDINATOR || role.role_name === "Coordenador") &&
          role.active
      );
      return !!validRole;
    })
    .map((membership) => membership.departmentName);

  const uniqueCoordinatorTeams = Array.from(new Set(coordinatorTeams));
  const teamMemberships = memberships.filter((membership) =>
    uniqueCoordinatorTeams.includes(membership.departmentName)
  );

  return (
    <CoordinatorTeamManagementSearch
      coordinatorTeams={uniqueCoordinatorTeams}
      memberships={teamMemberships}
      users={users}
      dict={dict}
      locale={locale}
    />
  );
}

export default function TeamManagementPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <TeamManagementContent {...props} />
    </Suspense>
  );
}
