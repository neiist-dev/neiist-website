import { VotingSession } from "@/types/voting";
import styles from "@/styles/components/voting/SessionHistory.module.css";

interface SessionHistoryProps {
  sessions: VotingSession[];
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const finished = sessions.filter((s) => s.status === "finished");

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Histórico</h2>

      {finished.length === 0 ? (
        <p className={styles.empty}>Ainda não existem sessões terminadas.</p>
      ) : (
        <ul className={styles.list}>
          {finished.map((session) => (
            <li key={session.id} className={styles.item}>
              <div className={styles.main}>
                <strong>{session.name}</strong>
                <span>
                  {session.winners.length === 0
                    ? "Sem vencedor"
                    : session.winners.map((w) => w.name).join(" & ")}
                </span>
              </div>
              <div className={styles.meta}>
                {session.winners[0] && <span>{session.winners[0].voteCount} votos</span>}
                {session.revealedAt && (
                  <time dateTime={session.revealedAt}>
                    {new Date(session.revealedAt).toLocaleString("pt-PT")}
                  </time>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
