import VotingSessionForm from "@/components/voting/admin/VotingSessionForm";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";

export default async function NewVotingSessionPage() {
  const [activities, users] = await Promise.all([getActivitiesEventsFromDb(), getAllUsers()]);

  return <VotingSessionForm activities={activities} users={users} />;
}
