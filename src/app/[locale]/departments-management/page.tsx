import { GoPeople, GoOrganization } from "react-icons/go";
import TeamsManagement from "@/components/admin/TeamsManagement";
import AdminBodiesManagement from "@/components/admin/AdminBodiesManagement";
import RolesManagement from "@/components/admin/RolesManagement";
import AboutUsManager from "@/components/admin/AboutUsManager";
import styles from "@/styles/pages/AdminDashboard.module.css";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

export default async function DepartmentsManagementPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRoles([UserRole._ADMIN]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale);
  const pageDict = dict.departments_management;

  const { tab = "teams" } = await searchParams;

  const tabs = [
    { id: "teams", name: pageDict.teams, icon: <GoPeople />, departmentType: "team" as const },
    {
      id: "bodies",
      name: pageDict.bodies,
      icon: <GoOrganization />,
      departmentType: "admin_body" as const,
    },
    {
      id: "aboutUs-order",
      name: pageDict.edit_about_us,
      icon: <GoOrganization />,
      departmentType: null,
    },
  ];

  const activeTab = tabs.some((t) => t.id === tab) ? tab : "teams";
  const activeType = tabs.find((t) => t.id === activeTab)?.departmentType ?? "team";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{pageDict.title}</h1>
      </header>
      <nav className={styles.tabBar}>
        {tabs.map((tabItem) => (
          <a
            key={tabItem.id}
            href={`?tab=${tabItem.id}`}
            className={`${styles.tabButton} ${activeTab === tabItem.id ? styles.activeTab : ""}`}>
            <span>{tabItem.icon}</span>
            {tabItem.name}
          </a>
        ))}
      </nav>
      <div className={styles.dashboard}>
        <section>
          {activeTab === "teams" && <TeamsManagement />}
          {activeTab === "bodies" && <AdminBodiesManagement />}
          {activeTab === "aboutUs-order" && <AboutUsManager dict={dict.about_us_page} />}
        </section>
        <section id="roles-section">
          {activeTab !== "aboutUs-order" && <RolesManagement initialDepartmentType={activeType} />}
        </section>
      </div>
    </div>
  );
}
