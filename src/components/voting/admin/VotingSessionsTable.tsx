"use client";

import { useMemo, useCallback, useState } from "react";
import {
  VotingSession,
  VotingType,
  VotingStatus,
  VOTING_TYPES,
  VOTING_STATUS,
  formatVotingDateRange,
} from "@/types/voting";
import { DataTable, ColumnDef, Badge, ContextMenu, ConfirmDialog, Alert } from "@neiist/ui";
import { FiEye, FiEyeOff, FiExternalLink, FiDownload, FiPlay, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  startVotingAction,
  finishVotingAction,
  deleteVotingSessionAction,
  togglePublishResultsAction,
} from "@/actions/admin/voting";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/voting/admin/VotingSessionsTable.module.css";

type ActionType = "start" | "finish" | "delete";

interface PendingAction {
  type: ActionType;
  session: VotingSession;
}

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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { type, session } = pendingAction;
    setPendingAction(null);

    try {
      if (type === "start") await startVotingAction(session.id);
      else if (type === "finish") await finishVotingAction(session.id);
      else await deleteVotingSessionAction(session.id);

      Alert.success(dict.details[`${type}_success`]);
      router.refresh();
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.details[`${type}_error`] || "Erro");
    }
  };

  const handleTogglePublish = useCallback(
    async (session: VotingSession) => {
      const nextState = !session.showResults;
      try {
        await togglePublishResultsAction(session.id, nextState);
        Alert.success(nextState ? dict.details.publish_success : dict.details.hide_success);
        router.refresh();
      } catch (err) {
        Alert.error(err instanceof Error ? err.message : dict.details.toggle_publish_error);
      }
    },
    [dict, router]
  );

  const renderSessionMenuItems = useCallback(
    (session: VotingSession) => (
      <>
        <ContextMenu.Item
          icon={<FiExternalLink size={15} />}
          onClick={() => {
            window.location.href = `/${locale}/voting/manage/${session.id}`;
          }}>
          {dict.table.view_full_details}
        </ContextMenu.Item>

        <ContextMenu.Item
          icon={<FiDownload size={15} />}
          onClick={() => {
            window.location.href = `/api/voting/${session.id}/export`;
          }}>
          {dict.table.export_excel}
        </ContextMenu.Item>

        <ContextMenu.Divider />

        {session.status === VOTING_STATUS.IDLE && (
          <ContextMenu.Item
            icon={<FiPlay size={15} />}
            onClick={() => setPendingAction({ type: "start", session })}>
            {dict.details.start_action}
          </ContextMenu.Item>
        )}

        {session.status === VOTING_STATUS.VOTING && (
          <ContextMenu.Item onClick={() => setPendingAction({ type: "finish", session })}>
            {dict.details.finish_action}
          </ContextMenu.Item>
        )}

        {session.status === VOTING_STATUS.FINISHED && (
          <ContextMenu.Item
            icon={session.showResults ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            onClick={() => handleTogglePublish(session)}>
            {session.showResults ? dict.details.hide_results : dict.details.publish_results}
          </ContextMenu.Item>
        )}

        <ContextMenu.Divider />

        <ContextMenu.Item
          icon={<FiTrash2 size={15} />}
          destructive
          onClick={() => setPendingAction({ type: "delete", session })}>
          {dict.details.delete_action}
        </ContextMenu.Item>
      </>
    ),
    [dict, handleTogglePublish, locale]
  );

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
    <>
      <DataTable
        data={filteredSessions}
        columns={columns}
        getRowId={(session) => String(session.id)}
        onRowClick={onRowClick}
        rowActions={renderSessionMenuItems}
        actionsTitle={dict.table.actions}
        emptyMessage={dict.table.empty}
        responsive="cards"
      />
      {pendingAction && (
        <ConfirmDialog
          open
          title={dict.details[`${pendingAction.type}_action`]}
          message={dict.details[`confirm_${pendingAction.type}`]}
          confirmLabel={dict.details.confirm_yes}
          cancelLabel={dict.details.confirm_cancel}
          isDestructive={pendingAction.type === "delete"}
          onConfirm={handleConfirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </>
  );
}
