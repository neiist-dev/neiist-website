import { GlobalVotingState } from "@/types/voting";
import VotingClient from "@/components/voting/VotingClient";
import {
  getVotingSessions,
  getSessionNominees,
  getUserVote,
  getSessionResults,
} from "@/utils/db/votingQueries";
import { serverCheckRoles } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VotingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, sessions, auth] = await Promise.all([
    searchParams,
    getVotingSessions(20),
    serverCheckRoles([]),
  ]);

  if (!auth.isAuthorized) return auth.error;

  const now = new Date();
  const activeVotingSessions = sessions.filter((session) => {
    if (session.status !== "voting") return false;
    if (session.startAt && new Date(session.startAt) > now) return false;
    return !(session.endAt && new Date(session.endAt) <= now);
  });

  const showLastResult = params.view === "lastresult";
  const initialGlobalState: GlobalVotingState = { activeSessions: [] };
  const initialUserVotes: Record<number, string | null> = {};

  if (activeVotingSessions.length === 0) {
    const lastFinishedSession = sessions.find((s) => s.status === "finished");
    if (lastFinishedSession) {
      const lastResults = await getSessionResults(lastFinishedSession.id);
      initialGlobalState.lastFinishedSession = {
        id: lastFinishedSession.id,
        name: lastFinishedSession.name,
        description: lastFinishedSession.description,
      };
      initialGlobalState.lastResults = lastResults.slice(0, 4);
    }
  } else {
    const sessionData = await Promise.all(
      activeVotingSessions.map(async (session) => {
        const [nominees, selectedNomineeId] = await Promise.all([
          getSessionNominees(session.id),
          getUserVote(session.id, auth.user!.istid),
        ]);
        return { session, nominees, selectedNomineeId };
      })
    );

    for (const data of sessionData) {
      initialGlobalState.activeSessions.push({
        sessionId: data.session.id,
        sessionName: data.session.name,
        sessionDescription: data.session.description,
        nominees: data.nominees,
      });
      initialUserVotes[data.session.id] = data.selectedNomineeId;
    }
  }

  return (
    <VotingClient
      initialGlobalState={initialGlobalState}
      initialUserVotes={initialUserVotes}
      showLastResult={showLastResult}
    />
  );
}
