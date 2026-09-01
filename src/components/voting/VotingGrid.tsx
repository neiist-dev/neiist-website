"use client";

import { useState } from "react";
import Image from "next/image";
import { VotingNominee } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import { getFirstAndLastName } from "@/utils/userUtils";
import Search from "@/components/search/Search";
import CommandPalette from "@/components/search/CommandPalette";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/voting/VotingGrid.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingGridProps {
  sessionId: number;
  sessionName: string | null;
  sessionDescription?: string | null;
  nominees: VotingNominee[];
  selectedNomineeId?: string | null;
  onVote?: (_nomineeId: string) => Promise<void> | void;
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const {
    results: filteredNominees,
    query: searchQuery,
    setQuery: setSearchQuery,
  } = useSearch<VotingNominee>({
    data: nominees,
    fields: [
      { field: "name", boost: 3 },
      { field: "id", boost: 4 },
    ],
    returnAllWhenEmpty: true,
  });

  const visibleNominees = filteredNominees.slice(0, visibleCount);
  const hasMore = filteredNominees.length > visibleCount;

  const handleCastVote = async (nomineeId: string) => {
    if (onVote) {
      await onVote(nomineeId);
    } else {
      const formData = new FormData();
      formData.set("sessionId", String(sessionId));
      formData.set("nomineeId", nomineeId);
      await submitVoteAction(formData);
    }
  };

  return (
    <section className={styles.wrapper}>
      <CommandPalette<VotingNominee>
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder={dict.search_nominee_placeholder}
        groups={[
          {
            heading: sessionName ?? "Candidatos",
            items: nominees,
          },
        ]}
        getItemKey={(n) => n.id}
        getItemLabel={(n) => `${getFirstAndLastName(n.name)} (${n.id})`}
        onSelect={(n) => handleCastVote(n.id)}
      />

      <header className={styles.header}>
        <p className={styles.kicker}>{dict.voting_in_progress}</p>
        <h1 className={styles.title}>{sessionName ?? dict.select_your_vote}</h1>
        {sessionDescription && <p className={styles.description}>{sessionDescription}</p>}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search
            className={styles.searchInput}
            placeholder={dict.search_nominee_placeholder}
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
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
