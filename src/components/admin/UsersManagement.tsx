import { User } from "@/types/user";
import { getAllUsers, getAllMemberships, getDepartmentRoles } from "@/utils/dbUtils";
import UsersSearchList from "@/components/admin/UsersSearchList";
import styles from "@/styles/components/admin/UsersManagement.module.css";

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
}

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

export default async function UsersManagement() {
  const users = await getAllUsers();
  const membershipsRaw = await getAllMemberships();

  const memberships: Membership[] = membershipsRaw.map((m, idx) => ({
    id: `${m.user_istid}-${m.department_name}-${m.role_name}-${idx}`,
    userNumber: m.user_istid,
    userName: m.user_name,
    departmentName: m.department_name,
    roleName: m.role_name,
    startDate: m.from_date,
    endDate: m.to_date ?? undefined,
    isActive: m.active,
    userEmail: "",
  }));

  const departments = [...new Set(memberships.map((m) => m.departmentName))];
  const roles: Role[] = (await Promise.all(departments.map((d) => getDepartmentRoles(d)))).flat();

  const usersWithMemberships: UserWithMemberships[] = users.map((user) => {
    const userMemberships = memberships.filter(
      (membership) => membership.userNumber === user.istid && membership.isActive
    );
    return {
      ...user,
      memberships: userMemberships,
    };
  });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestão de Utilizadores</h2>
      <UsersSearchList users={usersWithMemberships} roles={roles} />
    </div>
  );
}
