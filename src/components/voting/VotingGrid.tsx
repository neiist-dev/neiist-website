"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { VotingNominee } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import { getFirstAndLastName } from "@/utils/userUtils";
import styles from "@/styles/components/voting/VotingGrid.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingGridProps {
  sessionId: number;
  sessionName: string | null;
  sessionDescription?: string | null;
  nominees: VotingNominee[];
  selectedNomineeId?: string | null;
  onVote?: (_nomineeId: string) => Promise<void>;
  dict: Dictionary["voting"];
}

const PAGE_SIZE = 12;

export default function VotingGrid({
  sessionId,
  sessionName,
  sessionDescription,
  nominees,
  selectedNomineeId,
  onVote,
  dict,
}: VotingGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredNominees = useMemo(() => {
    if (!searchQuery.trim()) return nominees;
    const query = searchQuery.toLowerCase().trim();
    return nominees.filter((nominee) => {
      const displayName = getFirstAndLastName(nominee.name).toLowerCase();
      return (
        displayName.includes(query) ||
        nominee.name.toLowerCase().includes(query) ||
        nominee.id.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, nominees]);

  const visibleNominees = filteredNominees.slice(0, visibleCount);
  const hasMore = filteredNominees.length > visibleCount;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.kicker}>{dict.voting_in_progress}</p>
        <h1 className={styles.title}>{sessionName ?? dict.select_your_vote}</h1>
        {sessionDescription && <p className={styles.description}>{sessionDescription}</p>}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={dict.search_nominee_placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
        <p className={styles.count}>
          {dict.showing_nominees_count
            .replace("{visible}", String(visibleNominees.length))
            .replace("{total}", String(filteredNominees.length))}
        </p>
      </div>

      <div className={styles.grid}>
        {visibleNominees.map((nominee) => {
          const isSelected = selectedNomineeId === nominee.id;
          const displayName = getFirstAndLastName(nominee.name);

          return (
            <form
              key={nominee.id}
              action={async (formData) => {
                if (onVote) {
                  await onVote(nominee.id);
                } else {
                  await submitVoteAction(formData);
                }
              }}
              className={styles.gridItem}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="nomineeId" value={nominee.id} />
              <button
                type="submit"
                className={`${styles.card} ${isSelected ? styles.selectedCard : ""}`}>
                <div className={styles.photoWrapper}>
                  <Image
                    src={nominee.photoPath ?? "/default_user.png"}
                    alt={nominee.name}
                    fill
                    className={styles.photo}
                  />
                  <div className={styles.overlay}>
                    <span className={styles.cta}>
                      {isSelected
                        ? dict.current_vote
                        : selectedNomineeId
                          ? dict.change_vote
                          : dict.vote}
                    </span>
                  </div>
                </div>
                <div className={styles.nameWrapper}>
                  <span className={styles.name}>{displayName}</span>
                </div>
              </button>
            </form>
          );
        })}
      </div>

      {hasMore && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
            {dict.show_more_nominees}
          </button>
        </div>
      )}
    </section>
  );
}
