import { getAllMemberships } from "@/utils/dbUtils";
import { Membership } from "@/types/memberships";
import PhotoTeamMembers from "@/components/photo-management/PhotoTeamMembers";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";
import { getLocale, getDictionary } from "@/lib/i18n";

export default async function PhotoTeamMembersPage() {
  const memberships = await getAllMemberships();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  const activeMemberships: Membership[] = memberships.filter((membership) => membership.isActive);

  const membersByDepartment: Record<string, Membership[]> = {};
  activeMemberships.forEach((membership) => {
    if (!membersByDepartment[membership.departmentName]) {
      membersByDepartment[membership.departmentName] = [];
    }
    membersByDepartment[membership.departmentName].push(membership);
  });

  return (
    <>
      <h1 className={styles.title}>{dict.photo_team_members.page_title}</h1>
      <PhotoTeamMembers membersByDepartment={membersByDepartment} dict={dict.photo_team_members} />
    </>
  );
}
