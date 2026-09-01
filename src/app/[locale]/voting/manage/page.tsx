import { Suspense } from "react";
import {
  getVotingSessions,
  getVotingSessionById,
  getSessionResults,
} from "@/lib/db/repositories/voting.repository";
import { getActivitiesEventsFromDb } from "@/lib/db/repositories/event.repository";
import { getAllUsers } from "@/lib/db/repositories/user.repository";
import AdminVotingSync from "@/components/voting/AdminVotingSync";
import VotingManagement from "@/components/voting/admin/VotingManagement";
import VotingSessionDetailOverlay from "@/components/voting/admin/VotingSessionDetailOverlay";
import { requireRoles } from "@/lib/auth";
import { UserRole } from "@/types/user";
import { getDictionary } from "@/i18n/dictionaries";
import { defaultLocale, isValidLocale, LocaleParams } from "@/i18n/i18n-config";
import GlobalLoading from "@/app/loading";

interface PageProps {
  params: LocaleParams;
  searchParams: Promise<{ sessionId?: string }>;
}

async function VotingManageContent({ params, searchParams }: PageProps) {
  await requireRoles([UserRole._ADMIN]);
  const [{ locale: rawLocale }, searchParamsObj] = await Promise.all([params, searchParams]);
  const locale = isValidLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = getDictionary(locale).voting_management;

  const sessionId = searchParamsObj.sessionId ? parseInt(searchParamsObj.sessionId, 10) : undefined;

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
      <AdminVotingSync />
      <VotingManagement
        initialSessions={sessions}
        activities={activities}
        users={users}
        dict={dict}
        locale={locale}
        basePath={`/${locale}`}
      />
      {selectedSession ? (
        <VotingSessionDetailOverlay
          session={selectedSession}
          results={results || []}
          dict={dict}
          locale={locale}
        />
      ) : null}
    </>
  );
}

export default function VotingManagePage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<GlobalLoading />}>
      <VotingManageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
