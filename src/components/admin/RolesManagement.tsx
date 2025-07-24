import { getAllDepartments, getDepartmentRoles } from "@/utils/dbUtils";
import RolesSearchFilter from "@/components/admin/RolesSearchFilter";
import styles from "@/styles/components/admin/RolesManagement.module.css";

export default async function RolesManagement() {
  const departments = await getAllDepartments();
  const initialDepartment = departments[0]?.name || "";
  const initialRoles = initialDepartment ? await getDepartmentRoles(initialDepartment) : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestão de Cargos</h1>
      <RolesSearchFilter
        departments={departments}
        initialDepartment={initialDepartment}
        initialRoles={initialRoles}
      />
    </div>
  );
}
