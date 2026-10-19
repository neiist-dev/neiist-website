"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  VotingSession,
  VotingType,
  VotingStatus,
  VOTING_TYPES,
  VOTING_STATUS,
  formatVotingDateRange,
} from "@/types/voting";
import { DataTable, ColumnDef, Badge, Button, DropdownMenu } from "@neiist/ui";
import {
  FiEye,
  FiEyeOff,
  FiMoreVertical,
  FiExternalLink,
  FiDownload,
  FiPlay,
  FiTrash2,
} from "react-icons/fi";
import { useVotingActions } from "@/hooks/useVotingActions";
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
  const router = useRouter();
  const { confirm, togglePublish, exportExcel, dialog } = useVotingActions(dict);

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
            {formatVotingDateRange(session.startAt, session.endAt, locale)}
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
      {
        id: "actions",
        header: "",
        width: 48,
        cell: (session) => (
          <DropdownMenu align="end">
            <DropdownMenu.Trigger>
              <Button
                type="button"
                variant="ghost"
                color="neutral"
                size="icon"
                aria-label={dict.table.actions}
                onClick={(e) => e.stopPropagation()}>
                <FiMoreVertical size={16} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" mobileTitle={dict.table.actions}>
              <DropdownMenu.Item
                icon={<FiExternalLink size={15} />}
                onClick={() => {
                  window.location.href = `/${locale}/voting/manage/${session.id}`;
                }}>
                {dict.table.view_full_details}
              </DropdownMenu.Item>

              <DropdownMenu.Item
                icon={<FiDownload size={15} />}
                onClick={() => exportExcel(session.id)}>
                {dict.table.export_excel}
              </DropdownMenu.Item>

              <DropdownMenu.Divider />

              {session.status === VOTING_STATUS.IDLE && (
                <DropdownMenu.Item
                  icon={<FiPlay size={15} />}
                  onClick={() => confirm("start", session)}>
                  {dict.details.start_action}
                </DropdownMenu.Item>
              )}

              {session.status === VOTING_STATUS.VOTING && (
                <DropdownMenu.Item onClick={() => confirm("finish", session)}>
                  {dict.details.finish_action}
                </DropdownMenu.Item>
              )}

              {session.status === VOTING_STATUS.FINISHED && (
                <DropdownMenu.Item
                  icon={session.showResults ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  onClick={() => togglePublish(session)}>
                  {session.showResults ? dict.details.hide_results : dict.details.publish_results}
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Divider />

              <DropdownMenu.Item
                icon={<FiTrash2 size={15} />}
                destructive
                onClick={() => confirm("delete", session)}>
                {dict.details.delete_action}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
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
      confirm,
      exportExcel,
      router,
      togglePublish,
    ]
  );

  return (
    <>
      <DataTable
        data={filteredSessions}
        columns={columns}
        getRowId={(session) => String(session.id)}
        onRowClick={onRowClick}
        emptyMessage={dict.table.empty}
        responsive="cards"
      />
      {dialog}
    </>
  );
}
