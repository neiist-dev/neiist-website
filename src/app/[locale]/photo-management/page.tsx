import { Membership } from "@/types/memberships";
import PhotoTeamMembers from "@/components/photo-management/PhotoTeamMembers";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";
import { getAllMemberships, getAllDepartments } from "@/lib/db/repositories/team.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";

interface PageProps {
  params: LocaleParams;
}

export default async function PhotoTeamMembersPage({ params }: PageProps) {
  await requireRoles([UserRole._ADMIN, UserRole._COORDINATOR]);

  const { locale: rawLocale } = await params;
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).photo_management;

  const memberships = await getAllMemberships();
  const departments = await getAllDepartments();

  const activeMemberships: Membership[] = memberships.filter((membership) => membership.isActive);

  const membersByDepartment: Record<string, Membership[]> = {};
  activeMemberships.forEach((membership) => {
    if (!membersByDepartment[membership.departmentName])
      membersByDepartment[membership.departmentName] = [];

    membersByDepartment[membership.departmentName].push(membership);
  });

  return (
    <>
      <h1 className={styles.title}>{dict.title}</h1>
      <PhotoTeamMembers
        membersByDepartment={membersByDepartment}
        departments={departments}
        dict={dict}
      />
    </>
  );
}
