"use client";

import { useMemo } from "react";
import {
  VotingSession,
  VotingType,
  VotingStatus,
  VOTING_TYPES,
  VOTING_STATUS,
} from "@/types/voting";
import { DataTable, ColumnDef, Badge } from "@neiist/ui";
import { FiEye, FiEyeOff } from "react-icons/fi";
import styles from "@/styles/components/voting/admin/VotingSessionsTable.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionsTableProps {
  sessions: VotingSession[];
  onRowClick: (_session: VotingSession) => void;
  filters: {
    type: VotingType[];
    status: VotingStatus[];
    dateRange: { start: Date | null; end: Date | null };
  };
  onToggleTypeFilter: () => void;
  onToggleStatusFilter: () => void;
  onToggleDateFilter: () => void;
  typeFilterRef: React.RefObject<HTMLButtonElement | null>;
  statusFilterRef: React.RefObject<HTMLButtonElement | null>;
  dateFilterRef: React.RefObject<HTMLButtonElement | null>;
  dict: Dictionary["voting_management"];
  locale?: string;
}

const TYPE_BADGE: Record<VotingType, "secondary" | "outline" | "tertiary"> = {
  [VOTING_TYPES.ACTIVITY]: "secondary",
  [VOTING_TYPES.USERS]: "outline",
  [VOTING_TYPES.CUSTOM]: "tertiary",
};

const STATUS_BADGE: Record<VotingStatus, "primary" | "outline" | "danger"> = {
  [VOTING_STATUS.VOTING]: "primary",
  [VOTING_STATUS.IDLE]: "outline",
  [VOTING_STATUS.FINISHED]: "danger",
};

function formatDateRange(start?: string | Date, end?: string | Date, locale = "pt") {
  if (!start && !end) return "—";
  const dateLocale = locale === "en" ? "en-GB" : "pt-PT";
  const startDate = start ? new Date(start).toLocaleDateString(dateLocale) : "...";
  const endDate = end ? new Date(end).toLocaleDateString(dateLocale) : "...";
  return `${startDate} → ${endDate}`;
}

export default function VotingSessionsTable({
  sessions,
  onRowClick,
  filters,
  onToggleTypeFilter,
  onToggleStatusFilter,
  onToggleDateFilter,
  typeFilterRef,
  statusFilterRef,
  dateFilterRef,
  dict,
  locale = "pt",
}: VotingSessionsTableProps) {
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesType = filters.type.length === 0 || filters.type.includes(session.type);
      const matchesStatus = filters.status.length === 0 || filters.status.includes(session.status);

      const { start, end } = filters.dateRange;
      let matchesDate = true;
      if (start && session.startAt)
        matchesDate = matchesDate && new Date(session.startAt) >= new Date(start);

      if (end && session.endAt)
        matchesDate = matchesDate && new Date(session.endAt) <= new Date(end);

      return matchesType && matchesStatus && matchesDate;
    });
  }, [sessions, filters]);

  const columns = useMemo<ColumnDef<VotingSession>[]>(
    () => [
      {
        id: "title",
        header: dict.table.title,
        dataLabel: dict.table.title,
        cell: (session) => (
          <div className={styles.titleCell}>
            <span className={styles.name}>{session.name}</span>
            {session.description && (
              <span className={styles.description}>{session.description}</span>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: dict.table.type,
        dataLabel: dict.table.type,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          typeFilterRef.current = ref.current;
          onToggleTypeFilter();
        },
        cell: (session) => (
          <Badge variant={TYPE_BADGE[session.type]}>{dict.types[session.type]}</Badge>
        ),
      },
      {
        id: "period",
        header: dict.table.period,
        dataLabel: dict.table.period,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          dateFilterRef.current = ref.current;
          onToggleDateFilter();
        },
        cell: (session) => (
          <span className={styles.period}>
            {formatDateRange(session.startAt, session.endAt, locale)}
          </span>
        ),
      },
      {
        id: "voters",
        header: dict.table.voters,
        dataLabel: dict.table.voters,
        cell: (session) => <span className={styles.votes}>{session.totalVotes || 0}</span>,
      },
      {
        id: "status",
        header: dict.table.status,
        dataLabel: dict.table.status,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          statusFilterRef.current = ref.current;
          onToggleStatusFilter();
        },
        cell: (session) => (
          <div className={styles.statusCell}>
            <Badge variant={STATUS_BADGE[session.status]}>{dict.statuses[session.status]}</Badge>
            {session.status === VOTING_STATUS.FINISHED && (
              <span
                title={
                  session.showResults ? dict.details.results_public : dict.details.results_hidden
                }
                className={`${styles.resultsIcon} ${
                  session.showResults ? styles.resultsIconPublished : ""
                }`}>
                {session.showResults ? <FiEye size={16} /> : <FiEyeOff size={16} />}
              </span>
            )}
          </div>
        ),
      },
    ],
    [
      dict,
      locale,
      onToggleTypeFilter,
      onToggleDateFilter,
      onToggleStatusFilter,
      typeFilterRef,
      dateFilterRef,
      statusFilterRef,
    ]
  );

  return (
    <DataTable
      data={filteredSessions}
      columns={columns}
      getRowId={(session) => String(session.id)}
      onRowClick={onRowClick}
      emptyMessage={dict.table.empty}
      responsive="cards"
    />
  );
}
