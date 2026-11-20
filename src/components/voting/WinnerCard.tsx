import Image from "next/image";
import { SessionResult, VotingType, isUserVotingType } from "@/types/voting";
import styles from "@/styles/components/voting/WinnerCard.module.css";
import { getFirstAndLastName } from "@/utils/userUtils";
import type { Dictionary } from "@/i18n/dictionaries";

interface WinnerCardProps {
  results: SessionResult[];
  sessionType?: VotingType;
  dict: Dictionary["voting"];
}

export default function WinnerCard({ results, sessionType, dict }: WinnerCardProps) {
  const topResults = results.slice(0, 3);

  if (!topResults.length || topResults[0].voteCount === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{dict.no_votes_cast}</p>
      </div>
    );
  }

  const isUserType = isUserVotingType(sessionType);
  let currentRank = 1;
  let lastVoteCount = -1;

  return (
    <div className={styles.resultsGrid}>
      {topResults.map((result, index) => {
        if (result.voteCount !== lastVoteCount) currentRank = index + 1;

        lastVoteCount = result.voteCount;

        const displayName = isUserType
          ? getFirstAndLastName(result.nomineeName)
          : result.nomineeName;
        const hasPhoto = Boolean(result.nomineePhotoPath);
        const isTextOnly = !hasPhoto && !isUserType;

        return (
          <div
            key={result.nomineeId}
            className={`${styles.card} ${styles[`rank${currentRank}`] || ""}`}>
            <div className={styles.imageCard}>
              <div className={styles.rankBadge}>
                {dict.rank_format.replace("{rank}", String(currentRank))}
              </div>

              {hasPhoto ? (
                <Image
                  src={result.nomineePhotoPath!}
                  alt={result.nomineeName}
                  fill
                  className={styles.image}
                />
              ) : isUserType ? (
                <Image
                  src="/default_user.png"
                  alt={result.nomineeName}
                  fill
                  className={styles.image}
                />
              ) : (
                <div className={styles.textFront}>
                  <span className={styles.textFrontTitle}>{displayName}</span>
                </div>
              )}
            </div>

            <div className={styles.infoWrap}>
              {!isTextOnly && <h3 className={styles.name}>{displayName}</h3>}
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
