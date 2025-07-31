import { getAllDepartments, getAllMemberships, getAllUsers } from "@/utils/dbUtils";
import AboutUsEditor from "@/components/admin/AboutUsEditor";
import { Membership } from "@/types/memberships";

export default async function AboutUsManager() {
  const departments = await getAllDepartments();
  const memberships: Membership[] = await getAllMemberships();
  const users = await getAllUsers();

  return <AboutUsEditor departments={departments} memberships={memberships} users={users} />;
}
