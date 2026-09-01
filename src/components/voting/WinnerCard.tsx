import Image from "next/image";
import { SessionResult } from "@/types/voting";
import styles from "@/styles/components/voting/WinnerCard.module.css";
import { getFirstAndLastName } from "@/utils/userUtils";
import type { Dictionary } from "@/i18n/dictionaries";

interface WinnerCardProps {
  results: SessionResult[];
  dict: Dictionary["voting"];
}

export default function WinnerCard({ results, dict }: WinnerCardProps) {
  const sortedResults = [...results].sort((a, b) => b.voteCount - a.voteCount);
  const topResults = sortedResults.slice(0, 3);

  if (!topResults.length || topResults[0].voteCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{dict.no_votes_cast}</p>
      </div>
    );
  }

  let currentRank = 1;
  let lastVoteCount = -1;

  return (
    <div className={styles.resultsGrid}>
      {topResults.map((result, index) => {
        if (result.voteCount !== lastVoteCount) {
          currentRank = index + 1;
        }
        lastVoteCount = result.voteCount;

        return (
          <div
            key={result.nomineeId}
            className={`${styles.card} ${styles[`rank${currentRank}`] || ""}`}>
            <div className={styles.rankBadge}>{currentRank}º</div>

            <div className={styles.imageWrap}>
              <Image
                src={result.nomineePhotoPath ?? "/default_user.png"}
                alt={result.nomineeName}
                fill
                className={styles.image}
              />
            </div>

            <div className={styles.infoWrap}>
              <h2 className={styles.name}>{getFirstAndLastName(result.nomineeName)}</h2>
              <p className={styles.votes}>
                {result.voteCount} {result.voteCount === 1 ? dict.vote_singular : dict.vote_plural}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
