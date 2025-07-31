import { GoPeople, GoOrganization } from "react-icons/go";
import TeamsManagement from "@/components/admin/TeamsManagement";
import AdminBodiesManagement from "@/components/admin/AdminBodiesManagement";
import RolesManagement from "@/components/admin/RolesManagement";
import AboutUsManager from "@/components/admin/AboutUsManager";
import styles from "@/styles/pages/AdminDashboard.module.css";

const tabs = [
  { id: "teams", name: "Equipas", icon: <GoPeople />, departmentType: "team" },
  {
    id: "bodies",
    name: "Órgãos Administrativos",
    icon: <GoOrganization />,
    departmentType: "admin_body",
  },
  {
    id: "aboutUs-order",
    name: "Editar Página Sobre Nós",
    icon: <GoOrganization />,
    departmentType: null,
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
          {activeTab === "aboutUs-order" && <AboutUsManager />}
        </section>
        <section id="roles-section">
          {activeTab !== "aboutUs-order" && <RolesManagement initialDepartmentType={activeType} />}
        </section>
      </div>
    </div>
  );
}
