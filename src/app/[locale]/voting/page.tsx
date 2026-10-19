import { Suspense } from "react";
import VotingClient from "@/components/voting/VotingClient";
import { getGlobalVotingState, getUserVotes } from "@/lib/db/repositories/voting.repository";
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
  const [{ locale: rawLocale }, searchParamsObj, initialGlobalState] = await Promise.all([
    params,
    searchParams,
    getGlobalVotingState(),
  ]);

  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).voting;
  const showLastResult = searchParamsObj.view === "lastresult";

  const initialUserVotes: Record<number, string[]> = {};
  if (initialGlobalState.activeSessions.length > 0) {
    const votes = await Promise.all(
      initialGlobalState.activeSessions.map((session) =>
        getUserVotes(session.sessionId, user.istid)
      )
    );
    initialGlobalState.activeSessions.forEach((session, idx) => {
      initialUserVotes[session.sessionId] = votes[idx] ?? [];
    });
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
