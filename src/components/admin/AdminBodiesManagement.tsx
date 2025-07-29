import { getAllAdminBodies } from "@/utils/dbUtils";
import AdminBodiesSearchFilter from "@/components/admin/AdminBodiesSearchFilter";
import AddDepartmentModal from "@/components/admin/AddDepartmentModal";
import styles from "@/styles/components/admin/AdminBodiesManagement.module.css";

export default async function AdminBodiesManagement() {
  const adminBodies = await getAllAdminBodies();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestão dos Órgãos Administrativos</h2>
      <div className={styles.card}>
        <AdminBodiesSearchFilter initialAdminBodies={adminBodies} />
      </div>
      <AddDepartmentModal departmentType="admin_body" />
    </div>
  );
}
