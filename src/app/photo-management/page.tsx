import { getAllMemberships, getAllDepartments } from "@/utils/dbUtils";
import { Membership } from "@/types/memberships";
import PhotoTeamMembers from "@/components/photo-management/PhotoTeamMembers";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";

export default async function PhotoTeamMembersPage() {
  const memberships = await getAllMemberships();
  const departments = await getAllDepartments();

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
      <h1 className={styles.title}>Gestão de Fotos dos Membros</h1>
      <PhotoTeamMembers membersByDepartment={membersByDepartment} departments={departments} />
    </>
  );
}
