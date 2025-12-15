import { getAllUsers, getAllMemberships, getAllValidDepartmentRoles } from "@/utils/dbUtils";
import CoordinatorTeamManagementSearch from "@/components/team-management/CoordinatorTeamManagementSearch";
import { UserRole } from "@/types/user";
import { Membership } from "@/types/memberships";
import { cookies } from "next/headers";

interface Role {
  department_name: string;
  role_name: string;
  access: string;
  active: boolean;
}

export default async function TeamManagementPage() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data")?.value;
  const userData = userDataCookie ? JSON.parse(userDataCookie) : null;
  const istid = userData?.istid;

  const users = await getAllUsers();
  const memberships: Membership[] = await getAllMemberships();
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
          // Accept both possible values for coordinator
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
    />
  );
}
