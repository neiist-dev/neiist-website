import { getAllTeams } from "@/utils/dbUtils";
import TeamsSearchFilter from "@/components/admin/TeamsSearchFilter";
import AddDepartmentModal from "@/components/admin/AddDepartmentModal";
import styles from "@/styles/components/admin/TeamsManagement.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function TeamsManagement() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const teams = await getAllTeams();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dict.admin.teams_management.title}</h2>
      <div className={styles.card}>
        <TeamsSearchFilter initialTeams={teams} dict={dict.admin.teams_management}/>
      </div>
      <AddDepartmentModal departmentType="team" dict={dict.admin.add_department_modal}/>
    </div>
  );
}
