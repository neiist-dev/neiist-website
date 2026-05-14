import { getVotingSessions, getActivityNominees, getUserVote } from "@/utils/dbUtils";
import FullScreenWrapper from "@/components/FullScreenWrapper";
import VotingSync from "@/components/voting/VotingSync";
import VotingGrid from "@/components/voting/VotingGrid";
import StatusCard from "@/components/voting/StatusCard";
import SessionHistory from "@/components/voting/SessionHistory";
import { serverCheckRoles } from "@/utils/permissionUtils";
import styles from "@/styles/pages/VotingPage.module.css";

export const dynamic = "force-dynamic";

interface ActiveSessionView {
  sessionId: number;
  sessionName: string;
  nominees: Awaited<ReturnType<typeof getActivityNominees>>;
  selectedNomineeIstid: string | null;
}

export default async function VotingPage() {
  const sessions = await getVotingSessions(20);
  const activeVotingSessions = sessions.filter((session) => session.status === "voting");

  if (activeVotingSessions.length === 0) {
    return (
      <FullScreenWrapper>
        <VotingSync />
        <StatusCard title="Surpresas em breve!" subtitle="A votação vai começar em instantes." />
        <details className={styles.history}>
          <summary className={styles.summary}>Ver histórico</summary>
          <div className={styles.historyContent}>
            <SessionHistory sessions={sessions} />
          </div>
        </details>
      </FullScreenWrapper>
    );
  }

  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  const user = auth.user;

  if (!user?.istid) {
    return (
      <FullScreenWrapper>
        <VotingSync />
        <StatusCard
          title="Inicia sessão para votar"
          subtitle="Precisas de autenticação para submeter o teu voto."
        />
      </FullScreenWrapper>
    );
  }

  const activeSessionViews: ActiveSessionView[] = await Promise.all(
    activeVotingSessions.map(async (session) => {
      const [nominees, selectedNomineeIstid] = await Promise.all([
        getActivityNominees(session.activityId),
        getUserVote(session.id, user.istid),
      ]);

      return {
        sessionId: session.id,
        sessionName: session.name,
        nominees,
        selectedNomineeIstid,
      };
    })
  );

  const hasUnvotedSession = activeSessionViews.some((entry) => !entry.selectedNomineeIstid);

  const votingGrids = (
    <div className={styles.activeSessions}>
      {activeSessionViews.map((entry) => (
        <VotingGrid
          key={entry.sessionId}
          sessionId={entry.sessionId}
          sessionName={entry.sessionName}
          nominees={entry.nominees}
          selectedNomineeIstid={entry.selectedNomineeIstid}
        />
      ))}
    </div>
  );

  if (!hasUnvotedSession) {
    return (
      <FullScreenWrapper>
        <VotingSync />
        <StatusCard
          title="Votos submetidos!"
          subtitle="Ja votaste em todas as sessoes ativas. Podes atualizar qualquer voto abaixo."
        />
        {votingGrids}
      </FullScreenWrapper>
    );
  }

  return (
    <FullScreenWrapper>
      <VotingSync />
      {votingGrids}
    </FullScreenWrapper>
  );
}
