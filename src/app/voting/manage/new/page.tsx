import VotingSessionForm from "@/components/voting/admin/VotingSessionForm";
import { getActivitiesEventsFromDb, getAllUsers } from "@/utils/dbUtils";

export default async function NewVotingSessionPage() {
  const [activities, users] = await Promise.all([getActivitiesEventsFromDb(), getAllUsers()]);

  return <VotingSessionForm activities={activities} users={users} />;
}
