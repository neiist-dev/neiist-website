import { Membership } from "@/types/memberships";
import PhotoTeamMembers from "@/components/photo-management/PhotoTeamMembers";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";
import { getAllMemberships, getAllDepartments } from "@/lib/db/repositories/team.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";

export default async function PhotoTeamMembersPage() {
  await requireRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
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
      <h1 className={styles.title}>Gestão de Fotos dos Membros</h1>
      <PhotoTeamMembers membersByDepartment={membersByDepartment} departments={departments} />
    </>
  );
}
