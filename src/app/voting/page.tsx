import {
  getVotingSessions,
  getSessionNominees,
  getUserVote,
  getSessionResults,
} from "@/utils/dbUtils";
import VotingSync from "@/components/voting/VotingSync";
import VotingGrid from "@/components/voting/VotingGrid";
import WinnerCard from "@/components/voting/WinnerCard";
import ColorfulText from "@/components/ColorfulText";
import { FaArrowLeft } from "react-icons/fa";
import { serverCheckRoles } from "@/utils/permissionUtils";
import styles from "@/styles/pages/VotingPage.module.css";
import { VotingNominee } from "@/types/voting";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ActiveSessionView {
  sessionId: number;
  sessionName: string;
  nominees: VotingNominee[];
  selectedNomineeId: string | null;
}

export default async function VotingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sessions = await getVotingSessions(20);
  const now = new Date();
  const activeVotingSessions = sessions.filter((session) => {
    if (session.status !== "voting") return false;
    if (session.startAt && new Date(session.startAt) > now) return false;
    if (session.endAt && new Date(session.endAt) <= now) return false;
    return true;
  });

  if (activeVotingSessions.length === 0) {
    const lastFinishedSession = sessions.find((s) => s.status === "finished");
    const lastResults = lastFinishedSession ? await getSessionResults(lastFinishedSession.id) : [];

    const params = await searchParams;
    const showLastResult = params.view === "lastresult" && lastFinishedSession !== undefined;

    if (showLastResult && lastFinishedSession) {
      return (
        <>
          <VotingSync />
          <div className={styles.resultPage}>
            <div className={styles.resultHeader}>
              <Link href="?" scroll={false} className={styles.backButton}>
                <FaArrowLeft /> Voltar
              </Link>
              <ColorfulText
                as="h2"
                className={styles.resultTitle}
                text="Últimos Resultados"
                chunk={true}
              />
            </div>
            <div className={styles.resultContent}>
              <h3 className={styles.sessionTitle}>{lastFinishedSession.name}</h3>
              <WinnerCard
                sessionName={lastFinishedSession.name}
                results={lastResults.slice(0, 4)}
              />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <VotingSync />
        <div className={styles.waitingPage}>
          <h1 className={styles.waitingTitle}>
            Espera pela <span>votação</span>
            <br />
            começar
          </h1>
          <p className={styles.waitingSubtitle}>
            A votação vai começar em breve. A página atualiza automaticamente.
          </p>
          <div className={styles.waitingDots}>
            <span />
            <span />
            <span />
          </div>
          {lastFinishedSession && (
            <Link href="?view=lastresult" scroll={false} className={styles.lastResultButton}>
              Ver último resultado
            </Link>
          )}
        </div>
      </>
    );
  }

  const auth = await serverCheckRoles([]);
  if (!auth.isAuthorized) return auth.error;

  const activeSessionViews: ActiveSessionView[] = await Promise.all(
    activeVotingSessions.map(async (session) => {
      const [nominees, selectedNomineeId] = await Promise.all([
        getSessionNominees(session.id),
        getUserVote(session.id, auth.user!.istid),
      ]);

      return {
        sessionId: session.id,
        sessionName: session.name,
        nominees,
        selectedNomineeId,
      };
    })
  );

  const unvotedSessions = activeSessionViews.filter((entry) => !entry.selectedNomineeId);

  if (unvotedSessions.length === 0) {
    return (
      <>
        <VotingSync />
        <div className={styles.waitingPage}>
          <h1 className={styles.waitingTitle}>
            Votos <span>submetidos!</span>
          </h1>
          <p className={styles.waitingSubtitle}>Já votaste em todas as sessões ativas.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <VotingSync />
      <div className={styles.activeSessions}>
        {unvotedSessions.map((entry) => (
          <VotingGrid
            key={entry.sessionId}
            sessionId={entry.sessionId}
            sessionName={entry.sessionName}
            nominees={entry.nominees}
          />
        ))}
      </div>
    </>
  );
}
