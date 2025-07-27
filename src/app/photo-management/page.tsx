import { getAllUsers, getAllMemberships, getAllDepartments } from "@/utils/dbUtils";
import PhotoTeamMembers from "@/components/photo-management/PhotoTeamMembers";
import styles from "@/styles/components/photo-management/PhotoTeamMembers.module.css";

interface Membership {
  id: string;
  userNumber: string;
  userName: string;
  departmentName: string;
  roleName: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  userEmail: string;
  userPhoto: string;
}

export default async function PhotoTeamMembersPage() {
  const users = await getAllUsers();
  const membershipsRaw = await getAllMemberships();
  const departments = await getAllDepartments();

  const memberships: Membership[] = membershipsRaw
    .filter((membership) => membership.active)
    .map((membership, idx) => {
      const user = users.find((u) => u.istid === membership.user_istid);
      return {
        id: `${membership.user_istid}-${membership.department_name}-${membership.role_name}-${idx}`,
        userNumber: membership.user_istid,
        userName: membership.user_name,
        userEmail: user?.email || "",
        userPhoto: user?.photo || "",
        departmentName: membership.department_name,
        roleName: membership.role_name,
        startDate: membership.from_date,
        endDate: membership.to_date ?? undefined,
        isActive: membership.active,
      };
    });

  const membersByDepartment: Record<string, Membership[]> = {};
  memberships.forEach((membership) => {
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
