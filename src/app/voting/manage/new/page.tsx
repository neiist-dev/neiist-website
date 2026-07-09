import VotingSessionForm from "@/components/voting/admin/VotingSessionForm";
import { getAllUsers } from "@/utils/db/userQueries";
import { getActivitiesEventsFromDb } from "@/utils/db/eventQueries";

export default async function NewVotingSessionPage() {
  const [activities, users] = await Promise.all([getActivitiesEventsFromDb(), getAllUsers()]);

  return <VotingSessionForm activities={activities} users={users} />;
}
