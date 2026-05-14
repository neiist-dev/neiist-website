import { SessionResult } from "@/types/voting";
import styles from "@/styles/components/voting/LiveTally.module.css";

interface LiveTallyProps {
  sessionName: string | null;
  tally: SessionResult[];
}

export default function LiveTally({ sessionName, tally }: LiveTallyProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>
        Contagem ao vivo{sessionName ? ` — ${sessionName}` : ""}
      </h2>

      {tally.length === 0 ? (
        <p className={styles.empty}>Sem votos ainda.</p>
      ) : (
        <ol className={styles.list}>
          {tally.map((entry, i) => (
            <li key={entry.nomineeIstid} className={styles.item}>
              <span className={styles.rank}>#{i + 1}</span>
              <span className={styles.name}>{entry.nomineeName}</span>
              <strong className={styles.count}>{entry.voteCount}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
