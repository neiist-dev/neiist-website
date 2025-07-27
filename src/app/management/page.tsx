import TeamsManagement from "@/components/admin/TeamsManagement";
import AdminBodiesManagement from "@/components/admin/AdminBodiesManagement";
import RolesManagement from "@/components/admin/RolesManagement";
import MembershipsManagement from "@/components/admin/MembershipsManagement";
import UsersManagement from "@/components/admin/UsersManagement";
import styles from "@/styles/pages/AdminDashboard.module.css";
import { type Metadata } from "next";
import { GoPeople, GoOrganization, GoBriefcase, GoPerson, GoShield } from "react-icons/go";

type AdminSection = "teams" | "admin-bodies" | "roles" | "memberships" | "users";

const sections = [
  { id: "users" as AdminSection, name: "Utilizadores", icon: <GoShield /> },
  { id: "memberships" as AdminSection, name: "Membros", icon: <GoPerson /> },
  { id: "teams" as AdminSection, name: "Equipas", icon: <GoPeople /> },
  { id: "admin-bodies" as AdminSection, name: "Órgãos Administrativos", icon: <GoOrganization /> },
  { id: "roles" as AdminSection, name: "Cargos", icon: <GoBriefcase /> },
];

export const metadata: Metadata = {
  title: "Administração - NEIIST",
};

export default async function AdminDashboard({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {};
  const sectionParam = searchParams?.section;
  const activeSection =
    typeof sectionParam === "string" && sections.some((s) => s.id === sectionParam)
      ? (sectionParam as AdminSection)
      : "teams";

  let content = null;
  switch (activeSection) {
    case "teams":
      content = <TeamsManagement />;
      break;
    case "admin-bodies":
      content = <AdminBodiesManagement />;
      break;
    case "roles":
      content = <RolesManagement />;
      break;
    case "memberships":
      content = <MembershipsManagement />;
      break;
    case "users":
      content = <UsersManagement />;
      break;
    default:
      content = <TeamsManagement />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Administração</h1>
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
