import MembershipsSearchList from "./MembershipsSearchList";
import styles from "@/styles/components/admin/MembershipsManagement.module.css";
import { Membership } from "@/types/memberships";
import { getAllMemberships, getAllDepartments } from "@/lib/db/repositories/team.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import type { Dictionary } from "@/i18n/dictionaries";

export default async function MembershipsManagement({
  dict,
  locale = "pt",
}: {
  dict: Dictionary["admin"]["memberships_management"];
  locale?: string;
}) {
  const memberships: Membership[] = await getAllMemberships();
  const users = await getAllUsers();
  const departments = await getAllDepartments();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{dict.title}</h1>
      <MembershipsSearchList
        memberships={memberships}
        users={users}
        departments={departments}
        dict={dict}
        locale={locale}
      />
    </div>
  );
}
