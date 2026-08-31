import AdminBodiesSearchFilter from "@/components/admin/AdminBodiesSearchFilter";
import AddDepartmentModal from "@/components/admin/AddDepartmentModal";
import styles from "@/styles/components/admin/AdminBodiesManagement.module.css";
import { getAllAdminBodies } from "@/lib/db/repositories/team.repository";
import type { Dictionary } from "@/i18n/dictionaries";

export default async function AdminBodiesManagement({
  dict,
  addModalDict,
}: {
  dict: Dictionary["admin"]["bodies_management"];
  addModalDict: Dictionary["admin"]["add_department_modal"];
}) {
  const adminBodies = await getAllAdminBodies();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{dict.title}</h2>
      <div className={styles.card}>
        <AdminBodiesSearchFilter initialAdminBodies={adminBodies} dict={dict} />
      </div>
      <AddDepartmentModal departmentType="admin_body" dict={addModalDict} />
    </div>
  );
}
