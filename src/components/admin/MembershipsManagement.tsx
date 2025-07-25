import { getAllMemberships, getAllUsers, getAllDepartments } from "@/utils/dbUtils";
import MembershipsSearchList from "./MembershipsSearchList";
import styles from "@/styles/components/admin/MembershipsManagement.module.css";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  userEmail: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export default async function MembershipsManagement() {
  const membershipsRaw = await getAllMemberships();
  const users = await getAllUsers();
  const departments = await getAllDepartments();

  const memberships: Membership[] = membershipsRaw.map((membership, id) => {
    const user = users.find((user) => user.istid === membership.user_istid);
    return {
      id: `${membership.user_istid}-${membership.department_name}-${membership.role_name}-${id}`,
      userNumber: membership.user_istid,
      userName: membership.user_name,
      userEmail: user?.email || "",
      departmentName: membership.department_name,
      roleName: membership.role_name,
      startDate: membership.from_date,
      endDate: membership.to_date ?? undefined,
      isActive: membership.active,
    };
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestão de Membros</h1>
      <MembershipsSearchList memberships={memberships} users={users} departments={departments} />
    </div>
  );
}
