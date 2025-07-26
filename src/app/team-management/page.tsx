import { getAllUsers, getAllMemberships, getAllValidDepartmentRoles } from "@/utils/dbUtils";
import CoordinatorTeamManagementSearch from "@/components/team-management/CoordinatorTeamManagementSearch";
import { UserRole } from "@/types/user";
import { cookies } from "next/headers";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
  userPhoto: string;
}

interface Role {
  department_name: string;
  role_name: string;
  access: string;
  active: boolean;
}

export default async function TeamManagementPage() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("userData")?.value;
  const userData = userDataCookie ? JSON.parse(userDataCookie) : null;
  const istid = userData?.istid;

  const users = await getAllUsers();
  const membershipsRaw = await getAllMemberships();
  const validRoles: Role[] = await getAllValidDepartmentRoles();

  const memberships: Membership[] = membershipsRaw.map((m, idx) => ({
    id: `${m.user_istid}-${m.department_name}-${m.role_name}-${idx}`,
    userNumber: m.user_istid,
    userName: m.user_name,
    departmentName: m.department_name,
    roleName: m.role_name,
    startDate: m.from_date,
    endDate: m.to_date ?? undefined,
    isActive: m.active,
    userEmail: users.find((u) => u.istid === m.user_istid)?.email || "",
    userPhoto: users.find((user) => user.istid === m.user_istid)?.photo || "",
  }));

  const userMemberships = memberships.filter(
    (membership) => membership.userNumber === istid && membership.isActive
  );

  const coordinatorTeams = userMemberships
    .filter((membership) => {
      // Find a matching valid role for this department and role name
      const validRole = validRoles.find(
        (role) =>
          role.department_name === membership.departmentName &&
          role.role_name === membership.roleName &&
          role.access === UserRole._COORDINATOR &&
          role.active
      );
      return !!validRole;
    })
    .map((membership) => membership.departmentName);

  const uniqueCoordinatorTeams = Array.from(new Set(coordinatorTeams));
  const teamMemberships = memberships.filter((m) =>
    uniqueCoordinatorTeams.includes(m.departmentName)
  );

  return (
    <CoordinatorTeamManagementSearch
      coordinatorTeams={uniqueCoordinatorTeams}
      memberships={teamMemberships}
      users={users}
    />
  );
}
