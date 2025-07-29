import TeamsManagement from "@/components/admin/TeamsManagement";
import AdminBodiesManagement from "@/components/admin/AdminBodiesManagement";
import RolesManagement from "@/components/admin/RolesManagement";
import styles from "@/styles/pages/AdminDashboard.module.css";
import { GoPeople, GoOrganization } from "react-icons/go";

const tabs = [
  { id: "teams", name: "Equipas", icon: <GoPeople />, departmentType: "team" },
  {
    id: "bodies",
    name: "Órgãos Administrativos",
    icon: <GoOrganization />,
    departmentType: "admin_body",
  },
];

export default async function DepartmentsManagementPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const tabParam = params?.tab;
  const activeTab =
    typeof tabParam === "string" && tabs.some((t) => t.id === tabParam) ? tabParam : "teams";
  const activeType = tabs.find((t) => t.id === activeTab)?.departmentType ?? "team";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestão de Departamentos</h1>
      </header>
      <nav className={styles.tabBar}>
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`?tab=${tab.id}`}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ""}`}>
            <span>{tab.icon}</span>
            {tab.name}
          </a>
        ))}
      </nav>
      <div className={styles.dashboard}>
        <section>
          {activeTab === "teams" && <TeamsManagement />}
          {activeTab === "bodies" && <AdminBodiesManagement />}
        </section>
        <section id="roles-section">
          <RolesManagement initialDepartmentType={activeType} />
        </section>
      </div>
    </div>
  );
}
