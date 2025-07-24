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

  const memberships: Membership[] = membershipsRaw.map((m, idx) => {
    const user = users.find((u) => u.istid === m.user_istid);
    return {
      id: `${m.user_istid}-${m.department_name}-${m.role_name}-${idx}`,
      userNumber: m.user_istid,
      userName: m.user_name,
      userEmail: user?.email || "",
      departmentName: m.department_name,
      roleName: m.role_name,
      startDate: m.from_date,
      endDate: m.to_date ?? undefined,
      isActive: m.active,
    };
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestão de Membros</h1>
      <MembershipsSearchList memberships={memberships} users={users} departments={departments} />
    </div>
  );
}
