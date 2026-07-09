"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { VotingNominee } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import { getFirstAndLastName } from "@/utils/userUtils";
import styles from "@/styles/components/voting/VotingGrid.module.css";

interface VotingGridProps {
  sessionId: number;
  sessionName: string | null;
  sessionDescription?: string | null;
  nominees: VotingNominee[];
  selectedNomineeId?: string | null;
  onVote?: (_nomineeId: string) => Promise<void>;
}

const PAGE_SIZE = 12;

export default function VotingGrid({
  sessionId,
  sessionName,
  sessionDescription,
  nominees,
  selectedNomineeId,
  onVote,
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sessionId, searchQuery]);

  const visibleNominees = filteredNominees.slice(0, visibleCount);
  const hasMore = filteredNominees.length > visibleCount;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.kicker}>Votação em curso</p>
        <h1 className={styles.title}>{sessionName ?? "Seleciona o teu voto"}</h1>
        {sessionDescription && <p className={styles.description}>{sessionDescription}</p>}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Procurar por nome ou istID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className={styles.count}>
          A mostrar {visibleNominees.length} de {filteredNominees.length} candidatos
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
                      {isSelected ? "Voto atual" : selectedNomineeId ? "Mudar voto" : "Votar"}
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
            Mostrar mais candidatos
          </button>
        </div>
      )}
    </section>
  );
}
