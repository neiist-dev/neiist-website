"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VotingSession, SessionResult, VOTING_STATUS, VotingStatus } from "@/types/voting";
import {
  startVotingAction,
  finishVotingAction,
  deleteVotingSessionAction,
  togglePublishResultsAction,
} from "@/lib/votingSystem";
import { Modal, Badge, Button, ConfirmDialog, Text, Alert } from "@neiist/ui";
import { FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/components/voting/admin/VotingSessionDetailOverlay.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionDetailOverlayProps {
  session: VotingSession;
  results: SessionResult[];
  dict: Dictionary["voting_management"];
  locale?: string;
}

const STATUS_BADGE: Record<VotingStatus, "primary" | "outline" | "danger"> = {
  [VOTING_STATUS.VOTING]: "primary",
  [VOTING_STATUS.IDLE]: "outline",
  [VOTING_STATUS.FINISHED]: "danger",
};

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
  const [isResultsPublic, setIsResultsPublic] = useState(Boolean(session.showResults));
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleDelete = async () => {
    try {
      const formData = new FormData();
      formData.append("sessionId", String(session.id));
      await deleteVotingSessionAction(formData);
      Alert.success(dict.details.delete_success);
      handleClose();
    } catch (err) {
      console.error("Failed to delete voting session:", err);
      Alert.error(err instanceof Error ? err.message : dict.details.delete_error);
    }
  };

  const handleStartVoting = async () => {
    try {
      const formData = new FormData();
      formData.append("sessionId", String(session.id));
      await startVotingAction(formData);
      Alert.success(dict.details.start_success);
      handleClose();
    } catch (err) {
      console.error("Failed to start voting session:", err);
      Alert.error(err instanceof Error ? err.message : dict.details.start_error);
    }
  };

  const handleFinishVoting = async () => {
    try {
      const formData = new FormData();
      formData.append("sessionId", String(session.id));
      await finishVotingAction(formData);
      Alert.success(dict.details.finish_success);
      handleClose();
    } catch (err) {
      console.error("Failed to finish voting session:", err);
      Alert.error(err instanceof Error ? err.message : dict.details.finish_error);
    }
  };

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    try {
      const nextState = !isResultsPublic;
      const formData = new FormData();
      formData.append("sessionId", String(session.id));
      formData.append("showResults", String(nextState));
      await togglePublishResultsAction(formData);
      setIsResultsPublic(nextState);
      Alert.success(nextState ? dict.details.publish_success : dict.details.hide_success);
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
      Alert.error(err instanceof Error ? err.message : dict.details.toggle_publish_error);
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const totalVoters = session.totalVotes;
  const topResults = results.slice(0, 3);

  return (
    <>
      <Modal
        open={true}
        onClose={handleClose}
        size="md"
        title={session.name}
        badge={
          <Badge variant={STATUS_BADGE[session.status]}>{dict.statuses[session.status]}</Badge>
        }>
        {session.description && (
          <div className={styles.description}>
            <ReactMarkdown
              components={{
                a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}>
              {session.description}
            </ReactMarkdown>
          </div>
        )}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text size="sm" variant="muted">
              {dict.details.start}
            </Text>
            <Text size="md">{formatDate(session.startAt, locale)}</Text>
          </div>
          <div className={styles.infoItem}>
            <Text size="sm" variant="muted">
              {dict.details.end}
            </Text>
            <Text size="md">{formatDate(session.endAt, locale)}</Text>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="sm" variant="muted" className={styles.sectionTitle}>
              {dict.details.results}
              {session.status === VOTING_STATUS.VOTING ? ` — ${dict.details.live}` : ""}{" "}
              {results.length > 3 && dict.details.top_3}
            </Text>
          </div>

          {results.length === 0 ? (
            <Text variant="muted" size="sm">
              {dict.details.no_votes}
            </Text>
          ) : (
            <div className={styles.candidateList}>
              {topResults.map((result) => {
                const percentage = totalVoters > 0 ? (result.voteCount / totalVoters) * 100 : 0;
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
                <Text size="sm" variant="muted" className={styles.moreResults}>
                  {dict.details.more_results.replace("{count}", String(results.length - 3))}
                </Text>
              )}
            </div>
          )}
        </section>

        <div className={styles.actionButtons}>
          {session.status === VOTING_STATUS.IDLE && (
            <Button type="button" variant="primary" onClick={() => setPendingAction("start")}>
              {dict.details.start_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.VOTING && (
            <Button type="button" variant="outline" onClick={() => setPendingAction("finish")}>
              {dict.details.finish_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.FINISHED && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTogglePublish}
              loading={isTogglingPublish}>
              {isResultsPublic ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {isResultsPublic ? dict.details.hide_results : dict.details.publish_results}
            </Button>
          )}

          <Button type="button" variant="danger" onClick={() => setPendingAction("delete")}>
            <FiTrash2 size={16} />
            {dict.details.delete_action}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingAction === "start"}
        title={dict.details.start_action}
        message={dict.details.confirm_start}
        confirmLabel={dict.details.confirm_yes}
        cancelLabel={dict.details.confirm_cancel}
        onConfirm={async () => {
          setPendingAction(null);
          await handleStartVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "finish"}
        title={dict.details.finish_action}
        message={dict.details.confirm_finish}
        confirmLabel={dict.details.confirm_yes}
        cancelLabel={dict.details.confirm_cancel}
        onConfirm={async () => {
          setPendingAction(null);
          await handleFinishVoting();
        }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction === "delete"}
        title={dict.details.delete_action}
        message={dict.details.confirm_delete}
        confirmLabel={dict.details.confirm_yes}
        cancelLabel={dict.details.confirm_cancel}
        isDestructive={true}
        onConfirm={async () => {
          setPendingAction(null);
          await handleDelete();
        }}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
