import { getAllMemberships, getAllUsers, getAllDepartments } from "@/utils/dbUtils";
import MembershipsSearchList from "./MembershipsSearchList";
import styles from "@/styles/components/admin/MembershipsManagement.module.css";
import { Membership } from "@/types/memberships";

export default async function MembershipsManagement() {
  const memberships: Membership[] = await getAllMemberships();
  const users = await getAllUsers();
  const departments = await getAllDepartments();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestão de Membros</h1>
      <MembershipsSearchList memberships={memberships} users={users} departments={departments} />
    </div>
  );
}
