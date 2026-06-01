import {
  getVotingSessions,
  getActivitiesEventsFromDb,
  getAllUsers,
  getVotingSessionById,
  getSessionResults,
} from "@/utils/dbUtils";
import VotingSync from "@/components/voting/VotingSync";
import VotingManagement from "@/components/voting/admin/VotingManagement";
import VotingSessionDetailOverlay from "@/components/voting/admin/VotingSessionDetailOverlay";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function VotingManagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.sessionId ? parseInt(params.sessionId, 10) : undefined;

  const [sessions, activities, users] = await Promise.all([
    getVotingSessions(100),
    getActivitiesEventsFromDb(),
    getAllUsers(),
  ]);

  let selectedSession = null;
  let results = null;
  if (sessionId) {
    [selectedSession, results] = await Promise.all([
      getVotingSessionById(sessionId),
      getSessionResults(sessionId),
    ]);
  }

  return (
    <>
      <VotingSync />
      <VotingManagement initialSessions={sessions} activities={activities} users={users} />
      {selectedSession ? (
        <VotingSessionDetailOverlay session={selectedSession} results={results || []} />
      ) : null}
    </>
  );
}
