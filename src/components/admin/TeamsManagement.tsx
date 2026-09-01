import TeamsSearchFilter from "@/components/admin/TeamsSearchFilter";
import AddDepartmentModal from "@/components/admin/AddDepartmentModal";
import styles from "@/styles/components/admin/TeamsManagement.module.css";
import { getAllTeams } from "@/lib/db/repositories/team.repository";
import type { Dictionary } from "@/i18n/dictionaries";

export default async function TeamsManagement({
  dict,
  addModalDict,
}: {
  dict: Dictionary["admin"]["teams_management"];
  addModalDict: Dictionary["admin"]["add_department_modal"];
}) {
  const teams = await getAllTeams();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dict.title}</h2>
      <div className={styles.card}>
        <TeamsSearchFilter initialTeams={teams} dict={dict} />
      </div>
      <AddDepartmentModal departmentType="team" dict={addModalDict} />
    </div>
  );
}
