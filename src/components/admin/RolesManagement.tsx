import RolesSearchFilter from "@/components/admin/RolesSearchFilter";
import styles from "@/styles/components/admin/RolesManagement.module.css";
import { getAllDepartments, getDepartmentRoles } from "@/lib/db/repositories/team.repository";
import type { Dictionary } from "@/i18n/dictionaries";

export default async function RolesManagement({
  initialDepartmentType,
  dict,
}: {
  initialDepartmentType: string;
  dict: Dictionary["admin"]["roles_management"];
}) {
  const departments = (await getAllDepartments()).filter(
    (dept) => dept.department_type === initialDepartmentType
  );
  const initialDepartment = departments[0]?.name || "";
  const initialRoles = initialDepartment ? await getDepartmentRoles(initialDepartment) : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{dict.title}</h1>
      <RolesSearchFilter
        departments={departments}
        initialDepartment={initialDepartment}
        initialRoles={initialRoles}
        dict={dict}
      />
    </div>
  );
}
