import { getAllAdminBodies } from "@/utils/dbUtils";
import { AdminBodiesSearch, AddAdminBodyForm } from "@/components/admin/AdminBodiesSearchFilter";
import styles from "@/styles/components/admin/AdminBodiesManagement.module.css";

export default async function AdminBodiesManagement() {
  const adminBodies = await getAllAdminBodies();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestão dos Órgãos Administrativos</h2>
      <div className={styles.card}>
        <AddAdminBodyForm />
      </div>
      <div className={styles.card}>
        <AdminBodiesSearch adminBodies={adminBodies} />
      </div>
    </div>
  );
}
