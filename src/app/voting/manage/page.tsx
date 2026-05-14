import { getVotingSessions, getSessionResults, getActivitiesEventsFromDb } from "@/utils/dbUtils";
import VotingSync from "@/components/voting/VotingSync";
import SessionControls from "@/components/voting/SessionsControls";
import LiveTally from "@/components/voting/LiveTally";
import SessionHistory from "@/components/voting/SessionHistory";
import styles from "@/styles/pages/VotingManagePage.module.css";

export const dynamic = "force-dynamic";

export default async function VotingManagePage() {
  const [sessions, activities] = await Promise.all([
    getVotingSessions(20),
    getActivitiesEventsFromDb(),
  ]);

  const activeSessions = sessions.filter((session) => session.status === "voting");
  const activeTallies = await Promise.all(
    activeSessions.map(async (session) => ({
      sessionId: session.id,
      sessionName: session.name,
      tally: await getSessionResults(session.id),
    }))
  );

  return (
    <div className={styles.container}>
      <VotingSync />
      <header className={styles.header}>
        <h1>Painel de Votação</h1>
        <p>Controla o estado global da votação em tempo real.</p>
      </header>

      <div className={styles.grid}>
        <SessionControls activities={activities} sessions={sessions} />
        <div className={styles.talliesColumn}>
          {activeTallies.length === 0 ? (
            <LiveTally tally={[]} sessionName={null} />
          ) : (
            activeTallies.map((entry) => (
              <LiveTally
                key={entry.sessionId}
                tally={entry.tally}
                sessionName={entry.sessionName}
              />
            ))
          )}
        </div>
        <SessionHistory sessions={sessions} />
      </div>
    </div>
  );
}
