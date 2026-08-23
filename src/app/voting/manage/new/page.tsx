import VotingSessionForm from "@/components/voting/admin/VotingSessionForm";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";

export default async function NewVotingSessionPage() {
  await requireRoles([UserRole._ADMIN]);
  const [activities, users] = await Promise.all([getActivitiesEventsFromDb(), getAllUsers()]);

  return <VotingSessionForm activities={activities} users={users} />;
}
