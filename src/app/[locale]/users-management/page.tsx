import { Suspense } from "react";
import UsersManagement from "@/components/admin/UsersManagement";
import MembershipsManagement from "@/components/admin/MembershipsManagement";
import styles from "@/styles/pages/AdminDashboard.module.css";
import { GoPerson, GoShield } from "react-icons/go";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import GlobalLoading from "@/app/loading";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: LocaleParams;
  searchParams?: Promise<Record<string, string | string[]>>;
}

async function UsersManagementContent({ params, searchParams: searchParamsPromise }: PageProps) {
  await requireRoles([UserRole._ADMIN]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).admin;

  const sections = [
    { id: "users", name: dict.users_management.tab_users, icon: <GoShield /> },
    { id: "memberships", name: dict.users_management.tab_memberships, icon: <GoPerson /> },
  ];

  const searchParams = searchParamsPromise ? await searchParamsPromise : {};
  const sectionParam = searchParams?.section;
  const activeSection =
    typeof sectionParam === "string" && sections.some((s) => s.id === sectionParam)
      ? sectionParam
      : "users";

  const content =
    activeSection === "memberships" ? (
      <MembershipsManagement dict={dict.memberships_management} locale={locale} />
    ) : (
      <UsersManagement dict={dict.users_management} />
    );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{dict.users_management.page_title}</h1>
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

export default function UsersManagementPage(props: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <UsersManagementContent {...props} />
    </Suspense>
  );
}
