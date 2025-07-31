import { getAllDepartments, getAllMemberships, getAllUsers } from "@/utils/dbUtils";
import AboutUsEditor from "@/components/admin/AboutUsEditor";

export default async function AboutUsManager() {
  const departments = await getAllDepartments();
  const memberships = await getAllMemberships();
  const users = await getAllUsers();

  return <AboutUsEditor departments={departments} memberships={memberships} users={users} />;
}
