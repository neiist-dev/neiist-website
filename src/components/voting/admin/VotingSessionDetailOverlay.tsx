"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VotingSession, SessionResult, VOTING_STATUS } from "@/types/voting";
import { Modal, Badge, Button, Text, Progress } from "@neiist/ui";
import { FiExternalLink, FiPlay, FiEye, FiEyeOff, FiTrash2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { useVotingActions } from "@/hooks/useVotingActions";
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

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleNavigateToDetails = () => {
    window.location.href = `/${locale}/voting/manage/${session.id}`;
  };

  const { confirm, togglePublish, dialog } = useVotingActions(dict, { onDeleted: handleClose });

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
          <Badge
            variant={
              session.status === VOTING_STATUS.VOTING
                ? "primary"
                : session.status === VOTING_STATUS.FINISHED
                  ? "danger"
                  : "outline"
            }>
            {dict.statuses[session.status]}
          </Badge>
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

        {(session.startAt || session.endAt) && (
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{dict.details.start}</span>
              <span className={styles.infoValue}>{formatDate(session.startAt, locale)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{dict.details.end}</span>
              <span className={styles.infoValue}>{formatDate(session.endAt, locale)}</span>
            </div>
          </div>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text size="sm" variant="muted" className={styles.sectionTitle}>
              {dict.details.results}
              {session.status === VOTING_STATUS.VOTING ? ` — ${dict.details.live}` : ""}{" "}
              {results.length > 3 && dict.details.top_3}
            </Text>
            <Button
              type="button"
              variant="ghost"
              color="primary"
              size="sm"
              onClick={handleNavigateToDetails}>
              <FiExternalLink size={14} />
              {dict.details.view_full_details}
            </Button>
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
                    <Progress value={percentage} max={100} />
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
            <Button type="button" variant="primary" onClick={() => confirm("start", session)}>
              <FiPlay size={16} />
              {dict.details.start_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.VOTING && (
            <Button type="button" variant="outline" onClick={() => confirm("finish", session)}>
              {dict.details.finish_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.FINISHED && (
            <Button type="button" variant="outline" onClick={() => togglePublish(session)}>
              {session.showResults ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {session.showResults ? dict.details.hide_results : dict.details.publish_results}
            </Button>
          )}

          <Button type="button" variant="danger" onClick={() => confirm("delete", session)}>
            <FiTrash2 size={16} />
            {dict.details.delete_action}
          </Button>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
