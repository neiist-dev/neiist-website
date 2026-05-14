import Image from "next/image";
import { SessionResult } from "@/types/voting";
import styles from "@/styles/components/voting/WinnerCard.module.css";

interface WinnerCardProps {
  sessionName: string | null;
  results: SessionResult[];
}

export default function WinnerCard({ sessionName, results }: WinnerCardProps) {
  const topCount = results[0]?.voteCount ?? 0;
  const winners = results.filter((r) => r.voteCount === topCount);

  if (winners.length === 0 || topCount === 0) {
    return (
      <section className={styles.emptyState}>
        <h1>Sem resultados</h1>
        <p>Ninguém votou nesta sessão.</p>
      </section>
    );
  }

  const isTie = winners.length > 1;

  return (
    <section className={styles.wrapper}>
      <p className={styles.kicker}>{isTie ? "Empate!" : "Vencedor"}</p>
      {sessionName ? <h1 className={styles.category}>{sessionName}</h1> : null}

      <div className={isTie ? styles.tieGrid : styles.single}>
        {winners.map((winner) => (
          <div key={winner.nomineeIstid} className={styles.card}>
            <div className={styles.imageWrap}>
              <Image
                src={winner.nomineePhotoPath}
                alt={winner.nomineeName}
                width={isTie ? 200 : 320}
                height={isTie ? 200 : 320}
                className={styles.image}
              />
            </div>
            <h2 className={styles.name}>{winner.nomineeName}</h2>
            <p className={styles.votes}>{winner.voteCount} votos</p>
          </div>
        ))}
      </div>
    </section>
  );
}
