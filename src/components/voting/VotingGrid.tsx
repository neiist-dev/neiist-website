"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Modal, Button, Alert, SearchInput, SelectableCard, FloatingActionBar } from "@neiist/ui";
import { FaCheck } from "react-icons/fa";
import { VotingNominee, VotingType, isUserVotingType } from "@/types/voting";
import { submitVotesAction } from "@/lib/votingSystem";
import { getFirstAndLastName } from "@/utils/userUtils";
import CommandPalette from "@/components/search/CommandPalette";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/voting/VotingGrid.module.css";
import ReactMarkdown from "react-markdown";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingGridProps {
  sessionId: number;
  sessionName: string | null;
  sessionDescription?: string | null;
  sessionType?: VotingType;
  maxChoices?: number;
  nominees: VotingNominee[];
  selectedNomineeId?: string | null;
  selectedNomineeIds?: string[];
  onVote?: (_nomineeIds: string[]) => Promise<void> | void;
  dict: Dictionary["voting"];
}

const PAGE_SIZE = 36;

export default function VotingGrid({
  sessionId,
  sessionName,
  sessionDescription,
  sessionType,
  maxChoices = 1,
  nominees,
  selectedNomineeId,
  selectedNomineeIds,
  onVote,
  dict,
}: VotingGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modalNominee, setModalNominee] = useState<VotingNominee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const max = Math.max(1, Math.min(5, maxChoices));

  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedNomineeIds && selectedNomineeIds.length > 0
      ? selectedNomineeIds
      : selectedNomineeId
        ? [selectedNomineeId]
        : []
  );

  useEffect(() => {
    if (selectedNomineeIds) {
      setSelectedIds(selectedNomineeIds);
    } else if (selectedNomineeId) {
      setSelectedIds([selectedNomineeId]);
    }
  }, [selectedNomineeIds, selectedNomineeId]);

  const isUserType = isUserVotingType(sessionType);

  const {
    results: filteredNominees,
    query: searchQuery,
    setQuery: setSearchQuery,
  } = useSearch<VotingNominee>({
    data: nominees,
    fields: [
      { field: "name", boost: 3 },
      { field: "id", boost: 4 },
      { field: "description", boost: 2 },
    ],
    returnAllWhenEmpty: true,
  });

  const visibleNominees = filteredNominees.slice(0, visibleCount);
  const hasMore = filteredNominees.length > visibleCount;

  const handleCastVote = async (nomineeIds: string[]) => {
    if (isSubmitting || nomineeIds.length === 0) return;
    setIsSubmitting(true);
    try {
      if (onVote) {
        await onVote(nomineeIds);
      } else {
        const formData = new FormData();
        formData.set("sessionId", String(sessionId));
        nomineeIds.forEach((id) => formData.append("nomineeIds", id));
        await submitVotesAction(formData);
      }
    } catch (err) {
      console.error("Failed to cast vote:", err);
      Alert.error(err instanceof Error ? err.message : dict.vote_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNominee = async (nomineeId: string) => {
    if (isSubmitting) return;

    if (max === 1) {
      await handleCastVote([nomineeId]);
      return;
    }

    if (selectedIds.includes(nomineeId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== nomineeId));
      return;
    }

    if (selectedIds.length >= max) {
      Alert.info(dict.max_choices_reached.replace("{max}", String(max)));
      return;
    }

    if (selectedIds.length + 1 === max) {
      const next = [...selectedIds, nomineeId];
      setSelectedIds(next);
      await handleCastVote(next);
      return;
    }

    setSelectedIds((prev) => [...prev, nomineeId]);
  };

  return (
    <section className={styles.wrapper}>
      <CommandPalette<VotingNominee>
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder={isUserType ? dict.search_nominee_placeholder : dict.search_options_placeholder}
        groups={[
          {
            heading: sessionName ?? (isUserType ? dict.candidates : dict.options),
            items: nominees,
          },
        ]}
        getItemKey={(n) => n.id}
        getItemLabel={(n) => (isUserType ? `${getFirstAndLastName(n.name)} (${n.id})` : n.name)}
        onSelect={(n) => handleToggleNominee(n.id)}
      />

      <header className={styles.header}>
        <p className={styles.kicker}>{dict.voting_in_progress}</p>
        <h1 className={styles.title}>{sessionName ?? dict.select_your_vote}</h1>
        {sessionDescription && (
          <div className={styles.description}>
            <ReactMarkdown
              components={{
                a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}>
              {sessionDescription}
            </ReactMarkdown>
          </div>
        )}
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <SearchInput
            placeholder={
              isUserType ? dict.search_nominee_placeholder : dict.search_options_placeholder
            }
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setVisibleCount(PAGE_SIZE);
            }}
            onClear={() => {
              setSearchQuery("");
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>

        <p className={styles.count}>
          {(isUserType ? dict.showing_nominees_count : dict.showing_options_count)
            .replace("{visible}", String(visibleNominees.length))
            .replace("{total}", String(filteredNominees.length))}
        </p>
      </div>

      <div className={styles.grid}>
        {visibleNominees.map((nominee) => {
          const isSelected = selectedIds.includes(nominee.id);
          const displayName = isUserType ? getFirstAndLastName(nominee.name) : nominee.name;
          const hasPhoto = Boolean(nominee.photoPath);
          const hasDetails =
            !isUserType && (Boolean(nominee.description) || Boolean(nominee.descriptionPhotoPath));
          const isMultiple = max > 1;
          const hasExistingSelection = selectedIds.length > 0;

          return (
            <SelectableCard
              key={nominee.id}
              multiple={isMultiple}
              selected={isSelected}
              hasDetails={hasDetails}
              detailsLabel={dict.view_details}
              selectedLabel={
                isMultiple ? (
                  dict.remove_choice
                ) : (
                  <>
                    <FaCheck />
                    <span>{dict.current_vote}</span>
                  </>
                )
              }
              unselectedLabel={
                isMultiple
                  ? dict.select_choice
                  : hasExistingSelection
                    ? dict.change_vote
                    : dict.vote
              }
              title={
                hasPhoto || isUserType || Boolean(nominee.description) ? displayName : undefined
              }
              media={
                hasPhoto ? (
                  <Image
                    src={nominee.photoPath!}
                    alt={nominee.name}
                    fill
                    className={styles.photo}
                  />
                ) : isUserType ? (
                  <Image src="/default_user.png" alt={nominee.name} fill className={styles.photo} />
                ) : (
                  <SelectableCard.TextFront
                    title={!nominee.description ? displayName : undefined}
                    description={nominee.description}
                  />
                )
              }
              onClick={
                hasDetails ? () => setModalNominee(nominee) : () => handleToggleNominee(nominee.id)
              }
              aria-label={displayName}
            />
          );
        })}
      </div>

      {modalNominee && (
        <Modal
          open={Boolean(modalNominee)}
          onClose={() => setModalNominee(null)}
          title={modalNominee.name}
          size="md">
          {Boolean(modalNominee.descriptionPhotoPath || modalNominee.photoPath) && (
            <div className={styles.modalImageWrapper}>
              <Image
                src={(modalNominee.descriptionPhotoPath || modalNominee.photoPath)!}
                alt={modalNominee.name}
                fill
                className={styles.modalImage}
              />
            </div>
          )}

          {modalNominee.description && (
            <div className={styles.modalDescription}>
              <ReactMarkdown
                components={{
                  a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}>
                {modalNominee.description}
              </ReactMarkdown>
            </div>
          )}

          <Modal.Footer>
            <SelectableCard.Action
              variant="primary"
              selected={selectedIds.includes(modalNominee.id)}
              selectedLabel={max > 1 ? dict.remove_choice : dict.keep_vote}
              unselectedLabel={max > 1 ? dict.select_choice : dict.vote}
              onClick={async () => {
                const id = modalNominee.id;
                setModalNominee(null);
                await handleToggleNominee(id);
              }}
            />
          </Modal.Footer>
        </Modal>
      )}

      {max > 1 && selectedIds.length > 0 && (
        <FloatingActionBar
          countText={
            dict.choices_count
              ? dict.choices_count
                  .replace("{selected}", String(selectedIds.length))
                  .replace("{max}", String(max))
              : `${selectedIds.length} de ${max} escolhas`
          }
          action={
            <Button
              type="button"
              variant="solid"
              color="primary"
              size="sm"
              shape="pill"
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={() => handleCastVote(selectedIds)}>
              {dict.submit ?? "Submeter"}
            </Button>
          }
        />
      )}

      {hasMore && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
            {isUserType ? dict.show_more_nominees : dict.show_more_options}
          </button>
        </div>
      )}
    </section>
  );
}
