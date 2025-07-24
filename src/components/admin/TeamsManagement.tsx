import { getAllTeams } from "@/utils/dbUtils";
import { TeamsSearch, AddTeamForm } from "@/components/admin/TeamsSearchFilter";
import styles from "@/styles/components/admin/TeamsManagement.module.css";

export default async function TeamsManagement() {
  const teams = await getAllTeams();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestão de Equipas</h2>
      <div className={styles.card}>
        <AddTeamForm />
      </div>
      <div className={styles.card}>
        <TeamsSearch teams={teams} />
      </div>
    </div>
  );
}
