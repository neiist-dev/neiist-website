"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VotingSession, SessionResult } from "@/types/voting";
import {
  startVotingAction,
  finishVotingAction,
  deleteVotingSessionAction,
} from "@/lib/votingSystem";
import { FiX, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import styles from "@/styles/components/voting/admin/VotingSessionDetailOverlay.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionDetailOverlayProps {
  session: VotingSession;
  results: SessionResult[];
  dict: Dictionary["voting_management"];
  locale?: string;
}

function formatDate(date?: Date | string, locale = "pt") {
  return date ? new Date(date).toLocaleString(locale === "en" ? "en-GB" : "pt-PT") : "—";
}

export default function VotingSessionDetailOverlay({
  session,
  results,
  dict,
  locale = "pt",
}: VotingSessionDetailOverlayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingAction, setPendingAction] = useState<"start" | "finish" | "delete" | null>(null);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose]);

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await deleteVotingSessionAction(formData);
    handleClose();
  };

  const handleStartVoting = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await startVotingAction(formData);
    handleClose();
  };

  const handleFinishVoting = async () => {
    const formData = new FormData();
    formData.append("sessionId", String(session.id));
    await finishVotingAction(formData);
    handleClose();
  };

  const totalVotes = results.reduce((acc, result) => acc + result.voteCount, 0);
  const topResults = results.slice(0, 3);

  return (
    <div
      className={styles.container}
      onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label={dict.details.close}>
          <FiX size={32} />
        </button>

        <header className={styles.header}>
          <h2>{dict.details.header}</h2>
        </header>

        <div className={styles.name}>{session.name}</div>

        {session.description && <p className={styles.description}>{session.description}</p>}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>{dict.details.status}</label>
            <p>{dict.statuses[session.status]}</p>
          </div>
          <div className={styles.infoItem}>
            <label>{dict.details.type}</label>
            <p>{dict.types[session.type]}</p>
          </div>
          <div className={styles.infoItem}>
            <label>{dict.details.start}</label>
            <p>{formatDate(session.startAt, locale)}</p>
          </div>
          <div className={styles.infoItem}>
            <label>{dict.details.end}</label>
            <p>{formatDate(session.endAt, locale)}</p>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>
              {dict.details.results}
              {session.status === "voting" ? ` — ${dict.details.live}` : ""}{" "}
              {results.length > 3 && dict.details.top_3}
            </h3>
          </div>

          {results.length === 0 ? (
            <p>{dict.details.no_votes}</p>
          ) : (
            <div className={styles.candidateList}>
              {topResults.map((result) => {
                const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
                return (
                  <div key={result.nomineeId} className={styles.candidate}>
                    <div className={styles.candidateInfo}>
                      <span className={styles.candidateName}>{result.nomineeName}</span>
                      <span className={styles.voteCount}>
                        {result.voteCount} {dict.details.votes}
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {results.length > 3 && (
                <p className={styles.moreResults}>
                  {dict.details.more_results.replace("{count}", String(results.length - 3))}
                </p>
              )}
            </div>
          )}
        </section>

        <div className={styles.actionButtons}>
          {session.status === "idle" && (
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={() => setPendingAction("start")}>
              {dict.details.start_action}
            </button>
          )}

          {session.status === "voting" && (
            <button
              type="button"
              className={styles.buttonOutline}
              onClick={() => setPendingAction("finish")}>
              {dict.details.finish_action}
            </button>
          )}

          <button
            type="button"
            className={styles.buttonDanger}
            onClick={() => setPendingAction("delete")}>
            <FiTrash2 size={16} className={styles.buttonIcon} />
            {dict.details.delete_action}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction === "start"}
        message={dict.details.confirm_start}
        confirmText={dict.details.confirm_yes}
        cancelText={dict.details.confirm_cancel}
        onConfirm={async () => {
          setPendingAction(null);
          await handleStartVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "finish"}
        message={dict.details.confirm_finish}
        confirmText={dict.details.confirm_yes}
        cancelText={dict.details.confirm_cancel}
        onConfirm={async () => {
          setPendingAction(null);
          await handleFinishVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "delete"}
        message={dict.details.confirm_delete}
        confirmText={dict.details.confirm_yes}
        cancelText={dict.details.confirm_cancel}
        onConfirm={async () => {
          setPendingAction(null);
          await handleDelete();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
