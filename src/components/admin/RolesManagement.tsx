import { getAllDepartments, getDepartmentRoles } from "@/utils/dbUtils";
import RolesSearchFilter from "@/components/admin/RolesSearchFilter";
import styles from "@/styles/components/admin/RolesManagement.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function RolesManagement({
  initialDepartmentType,
}: {
  initialDepartmentType: string;
}) {

  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const departments = (await getAllDepartments()).filter(
    (dept) => dept.department_type === initialDepartmentType
  );
  const initialDepartment = departments[0]?.name || "";
  const initialRoles = initialDepartment ? await getDepartmentRoles(initialDepartment) : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{dict.admin.roles_management.title}</h1>
      <RolesSearchFilter
        departments={departments}
        initialDepartment={initialDepartment}
        initialRoles={initialRoles}
        dict={{ ...dict.admin.roles_management, confirm_dialog: dict.confirm_dialog }}
      />
    </div>
  );
}
