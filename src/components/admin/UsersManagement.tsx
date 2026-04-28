import { User } from "@/types/user";
import { getAllUsers, getAllMemberships, getDepartmentRoles } from "@/utils/dbUtils";
import UsersSearchList from "@/components/admin/UsersSearchList";
import styles from "@/styles/components/admin/UsersManagement.module.css";
import { Membership } from "@/types/memberships";
import { getLocale, getDictionary } from "@/lib/i18n";

interface Role {
  role_name: string;
  access: string;
  active: boolean;
}

interface UserWithMemberships extends User {
  memberships: Membership[];
}

export default async function UsersManagement() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const users = await getAllUsers();
  const memberships: Membership[] = await getAllMemberships();

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
      <h2 className={styles.title}>{dict.admin.users_management.title}</h2>
      <UsersSearchList users={usersWithMemberships} roles={roles} dict={dict.admin.users_management} />
    </div>
  );
}
