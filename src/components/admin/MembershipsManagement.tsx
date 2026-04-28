import { getAllMemberships, getAllUsers, getAllDepartments } from "@/utils/dbUtils";
import MembershipsSearchList from "./MembershipsSearchList";
import styles from "@/styles/components/admin/MembershipsManagement.module.css";
import { Membership } from "@/types/memberships";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function MembershipsManagement() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const memberships: Membership[] = await getAllMemberships();
  const users = await getAllUsers();
  const departments = await getAllDepartments();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{dict.admin.memberships_management.title}</h1>
      <MembershipsSearchList memberships={memberships} users={users} departments={departments} dict={{ ...dict.admin.memberships_management, confirm_dialog: dict.confirm_dialog }} />
    </div>
  );
}
