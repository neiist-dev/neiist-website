"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { VotingNominee } from "@/types/voting";
import { submitVoteAction } from "@/lib/votingSystem";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import styles from "@/styles/components/voting/VotingGrid.module.css";

interface VotingGridProps {
  sessionId: number;
  sessionName: string | null;
  nominees: VotingNominee[];
  selectedNomineeIstid?: string | null;
}

const PAGE_SIZE = 36;

function nomineeLabel(nominee: VotingNominee) {
  return `${nominee.name} (${nominee.istid})`;
}

export default function VotingGrid({
  sessionId,
  sessionName,
  nominees,
  selectedNomineeIstid,
}: VotingGridProps) {
  const [selectedNomineeFilter, setSelectedNomineeFilter] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const nomineeOptions = useMemo(() => nominees.map(nomineeLabel), [nominees]);

  const nomineeByOption = useMemo(
    () => new Map(nominees.map((nominee) => [nomineeLabel(nominee), nominee])),
    [nominees]
  );

  const selectedFilter = selectedNomineeFilter[0] ?? null;

  const filteredNominees = useMemo(() => {
    if (!selectedFilter) return nominees;

    const nominee = nomineeByOption.get(selectedFilter);
    return nominee ? [nominee] : nominees;
  }, [selectedFilter, nomineeByOption, nominees]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sessionId, selectedFilter]);

  const visibleNominees = filteredNominees.slice(0, visibleCount);
  const hasMore = filteredNominees.length > visibleCount;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.kicker}>Votação em curso</p>
        <h1 className={styles.title}>{sessionName ?? "Seleciona o teu voto"}</h1>
      </header>

      <div className={styles.toolbar}>
        <MultiSelectDropdown
          id={`nominee-filter-${sessionId}`}
          label="Filtrar nominee"
          availableItems={nomineeOptions}
          selectedItems={selectedNomineeFilter}
          onChange={setSelectedNomineeFilter}
          multiSelect={false}
          placeholder="Procurar por nome/IST ID"
        />
        <p className={styles.count}>
          A mostrar {visibleNominees.length} de {filteredNominees.length} nominees
        </p>
      </div>

      <div className={styles.grid}>
        {visibleNominees.map((nominee) => {
          const isSelected = selectedNomineeIstid === nominee.istid;

          return (
            <form key={nominee.istid} action={submitVoteAction}>
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="nomineeIstid" value={nominee.istid} />
              <button
                type="submit"
                className={`${styles.card} ${isSelected ? styles.selectedCard : ""}`}>
                <Image
                  src={nominee.photoPath}
                  alt={nominee.name}
                  width={180}
                  height={180}
                  className={styles.photo}
                />
                <span className={styles.name}>{nominee.name}</span>
                <span className={styles.cta}>
                  {isSelected ? "Voto atual" : selectedNomineeIstid ? "Mudar voto" : "Votar"}
                </span>
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
            Mostrar mais nominees
          </button>
        </div>
      )}
    </section>
  );
}
