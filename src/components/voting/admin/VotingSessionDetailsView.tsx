"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  VotingSession,
  SessionResult,
  VotingNominee,
  VOTING_STATUS,
  formatVotingDateRange,
  isUserVotingType,
} from "@/types/voting";
import { DataTable, ColumnDef, Badge, Button, Modal } from "@neiist/ui";
import ColorfulText from "@/components/ColorfulText";
import { FaArrowLeft } from "react-icons/fa";
import { FiDownload, FiPlay, FiEye, FiEyeOff } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { useVotingActions } from "@/hooks/useVotingActions";
import styles from "@/styles/components/voting/admin/VotingSessionDetailsView.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionDetailsViewProps {
  session: VotingSession;
  results: SessionResult[];
  nominees: VotingNominee[];
  dict: Dictionary["voting_management"];
  locale?: string;
}

export default function VotingSessionDetailsView({
  session,
  results,
  nominees,
  dict,
  locale = "pt",
}: VotingSessionDetailsViewProps) {
  const router = useRouter();
  const { confirm, togglePublish, exportExcel, dialog } = useVotingActions(dict);
  const [selectedNominee, setSelectedNominee] = useState<VotingNominee | null>(null);

  const totalVoters = session.totalVotes;

  const combinedResults = useMemo<SessionResult[]>(() => {
    const resultsMap = new Map(results.map((r) => [r.nomineeId, r]));
    const nomineesMap = new Map(nominees.map((n) => [n.id, n]));
    const allIds = new Set([...nominees.map((n) => n.id), ...results.map((r) => r.nomineeId)]);

    const list: SessionResult[] = Array.from(allIds).map((id) => {
      const res = resultsMap.get(id);
      const nom = nomineesMap.get(id);
      return {
        nomineeId: id,
        nomineeName: nom?.name || res?.nomineeName || id,
        nomineePhotoPath: nom?.photoPath ?? res?.nomineePhotoPath ?? null,
        description: nom?.description ?? res?.description ?? null,
        voteCount: res ? res.voteCount : 0,
      };
    });
    return list.sort((a, b) => b.voteCount - a.voteCount);
  }, [results, nominees]);

  const columns = useMemo<ColumnDef<SessionResult>[]>(
    () => [
      {
        id: "rank",
        header: dict.details.rank,
        dataLabel: dict.details.rank,
        width: 80,
        cell: (_row) => {
          const rank = combinedResults.filter((r) => r.voteCount > _row.voteCount).length + 1;
          const formattedRank = locale === "en" ? `#${rank}` : `${rank}º`;
          return <span className={styles.rankCell}>{formattedRank}</span>;
        },
      },
      {
        id: "nominee",
        header: dict.details.option_name,
        dataLabel: dict.details.option_name,
        isCardHeader: true,
        cell: (row) => (
          <div className={styles.nomineeCell}>
            {row.nomineePhotoPath ? (
              <Image
                src={row.nomineePhotoPath}
                alt={row.nomineeName}
                width={44}
                height={44}
                className={styles.nomineePhoto}
              />
            ) : (
              <Image
                src="/default_user.png"
                alt={row.nomineeName}
                width={44}
                height={44}
                className={styles.nomineePhoto}
              />
            )}
            <div className={styles.nomineeInfo}>
              <span className={styles.nomineeName}>{row.nomineeName}</span>
              {isUserVotingType(session.type) && (
                <span className={styles.nomineeId}>{row.nomineeId}</span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "description",
        header: dict.form.option_desc,
        dataLabel: dict.form.option_desc,
        cell: (row) => <span className={styles.descriptionCell}>{row.description || "—"}</span>,
      },
      {
        id: "votes",
        header: dict.table.voters,
        dataLabel: dict.table.voters,
        width: 120,
        cell: (row) => (
          <span className={styles.votesCell}>
            {row.voteCount} {dict.details.votes}
          </span>
        ),
      },
      {
        id: "percentage",
        header: dict.details.percentage,
        dataLabel: dict.details.percentage,
        cell: (row) => {
          const pct = totalVoters > 0 ? (row.voteCount / totalVoters) * 100 : 0;
          return (
            <div className={styles.percentageCell}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <span className={styles.percentageText}>{pct.toFixed(1)}%</span>
            </div>
          );
        },
      },
    ],
    [
      combinedResults,
      dict.details.option_name,
      dict.details.percentage,
      dict.details.rank,
      dict.details.votes,
      dict.form.option_desc,
      dict.table.voters,
      locale,
      session.type,
      totalVoters,
    ]
  );

  return (
    <div className={styles.container}>
      <Button
        type="button"
        variant="ghost"
        color="neutral"
        className={styles.backBtn}
        onClick={() => router.push(`/${locale}/voting/manage`)}>
        <FaArrowLeft /> {dict.details.back_to_manage}
      </Button>

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <ColorfulText as="h1" text={session.name} className={styles.title} />
            <div className={styles.badges}>
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
            </div>
          </div>

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

          <span className={styles.period}>
            {formatVotingDateRange(session.startAt, session.endAt, locale)}
          </span>
        </div>

        <div className={styles.actionsToolbar}>
          <Button type="button" variant="outline" size="sm" onClick={() => exportExcel(session.id)}>
            <FiDownload size={14} />
            {dict.details.export_excel}
          </Button>

          {session.status === VOTING_STATUS.IDLE && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => confirm("start", session)}>
              <FiPlay size={14} />
              {dict.details.start_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.VOTING && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => confirm("finish", session)}>
              {dict.details.finish_action}
            </Button>
          )}

          {session.status === VOTING_STATUS.FINISHED && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => togglePublish(session)}>
              {session.showResults ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              {session.showResults ? dict.details.hide_results : dict.details.publish_results}
            </Button>
          )}
        </div>
      </header>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>{dict.table.voters}</span>
          <span className={styles.metricValue}>{totalVoters}</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>{dict.details.total_options}</span>
          <span className={styles.metricValue}>{combinedResults.length}</span>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {dict.details.results_table}
            {session.status === VOTING_STATUS.VOTING ? ` (${dict.details.live})` : ""}
          </h2>
        </div>

        <DataTable
          data={combinedResults}
          columns={columns}
          getRowId={(row) => row.nomineeId}
          emptyMessage={dict.details.no_votes}
          responsive="cards"
          onRowClick={
            !isUserVotingType(session.type)
              ? (row) => {
                  const nom = nominees.find((n) => n.id === row.nomineeId);
                  const hasDetails = Boolean(
                    nom?.description || row.description || nom?.descriptionPhotoPath
                  );
                  if (!hasDetails) return;
                  setSelectedNominee(
                    nom || {
                      id: row.nomineeId,
                      name: row.nomineeName,
                      photoPath: row.nomineePhotoPath,
                      descriptionPhotoPath: row.nomineePhotoPath,
                      description: row.description,
                    }
                  );
                }
              : undefined
          }
        />
      </section>

      {selectedNominee && (
        <Modal
          open={Boolean(selectedNominee)}
          onClose={() => setSelectedNominee(null)}
          title={selectedNominee.name}
          size="md">
          {Boolean(selectedNominee.descriptionPhotoPath || selectedNominee.photoPath) && (
            <div className={styles.modalImageWrapper}>
              <Image
                src={(selectedNominee.descriptionPhotoPath || selectedNominee.photoPath)!}
                alt={selectedNominee.name}
                fill
                className={styles.modalImage}
              />
            </div>
          )}

          {selectedNominee.description && (
            <div className={styles.modalDescription}>
              <ReactMarkdown
                components={{
                  a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                }}>
                {selectedNominee.description}
              </ReactMarkdown>
            </div>
          )}

          <Modal.Footer>
            <Button variant="outline" type="button" onClick={() => setSelectedNominee(null)}>
              {dict.details.close || "Fechar"}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {dialog}
    </div>
  );
}
