import UsersManagement from "@/components/admin/UsersManagement";
import MembershipsManagement from "@/components/admin/MembershipsManagement";
import styles from "@/styles/pages/AdminDashboard.module.css";
import { GoPerson, GoShield } from "react-icons/go";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function UsersManagementPage({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {};
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  
  const sections = [
  { id: "users", name: dict.users_management_page.tab_users, icon: <GoShield /> },
  { id: "memberships", name: dict.users_management_page.tab_memberships, icon: <GoPerson /> },
  ];

  const sectionParam = searchParams?.section;
  const activeSection =
    typeof sectionParam === "string" && sections.some((s) => s.id === sectionParam)
      ? sectionParam
      : "users";

  let content = null;
  switch (activeSection) {
    case "users":
      content = <UsersManagement />;
      break;
    case "memberships":
      content = <MembershipsManagement />;
      break;
    default:
      content = <UsersManagement />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{dict.users_management_page.title}</h1>
      </header>
      <nav className={styles.tabBar}>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`?section=${section.id}`}
            className={`${styles.tabButton} ${activeSection === section.id ? styles.activeTab : ""}`}>
            <span>{section.icon}</span>
            {section.name}
          </a>
        ))}
      </nav>
      <div className={styles.dashboard}>{content}</div>
    </div>
  );
}
