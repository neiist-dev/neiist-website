import { Suspense } from "react";
import { GlobalVotingState } from "@/types/voting";
import VotingClient from "@/components/voting/VotingClient";
import {
  getVotingSessions,
  getSessionNominees,
  getUserVote,
  getSessionResults,
} from "@/lib/db/repositories/voting.repository";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function VotingContent({ params, searchParams }: PageProps) {
  const { user } = await requireUser();
  const [{ locale: rawLocale }, searchParamsObj, sessions] = await Promise.all([
    params,
    searchParams,
    getVotingSessions(20),
  ]);

  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).voting;

  const now = new Date();
  const activeVotingSessions = sessions.filter((session) => {
    if (session.status !== "voting") return false;
    if (session.startAt && new Date(session.startAt) > now) return false;
    return !(session.endAt && new Date(session.endAt) <= now);
  });

  const showLastResult = searchParamsObj.view === "lastresult";
  const initialGlobalState: GlobalVotingState = { activeSessions: [] };
  const initialUserVotes: Record<number, string | null> = {};

  if (activeVotingSessions.length === 0) {
    const lastFinishedSession = sessions.find((session) => session.status === "finished");
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
          getUserVote(session.id, user.istid),
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
      dict={dict}
    />
  );
}

export default function VotingPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <VotingContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
