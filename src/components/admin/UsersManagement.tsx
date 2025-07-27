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

  const memberships: Membership[] = membershipsRaw.map((membership, id) => ({
    id: `${membership.user_istid}-${membership.department_name}-${membership.role_name}-${id}`,
    userNumber: membership.user_istid,
    userName: membership.user_name,
    departmentName: membership.department_name,
    roleName: membership.role_name,
    startDate: membership.from_date,
    endDate: membership.to_date ?? undefined,
    isActive: membership.active,
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
      <h2 className={styles.title}>Visualização de Utilizadores</h2>
      <UsersSearchList users={usersWithMemberships} roles={roles} />
    </div>
  );
}
