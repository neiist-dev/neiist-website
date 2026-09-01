"use client";

import React, { useMemo } from "react";
import { VotingSession, VotingType, VotingStatus } from "@/types/voting";
import { TbFilter } from "react-icons/tb";
import styles from "@/styles/components/voting/admin/VotingSessionsTable.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingSessionsTableProps {
  sessions: VotingSession[];
  onRowClick: (_session: VotingSession) => void;
  searchQuery?: string;
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
}

export default function VotingSessionsTable({
  sessions,
  onRowClick,
  searchQuery = "",
  filters,
  onToggleTypeFilter,
  onToggleStatusFilter,
  onToggleDateFilter,
  typeFilterRef,
  statusFilterRef,
  dateFilterRef,
  dict,
}: VotingSessionsTableProps) {
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        !searchQuery ||
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filters.type.length === 0 || filters.type.includes(session.type);
      const matchesStatus = filters.status.length === 0 || filters.status.includes(session.status);

      const { start, end } = filters.dateRange;
      let matchesDate = true;
      if (start && session.startAt) {
        matchesDate = matchesDate && new Date(session.startAt) >= new Date(start);
      }
      if (end && session.endAt) {
        matchesDate = matchesDate && new Date(session.endAt) <= new Date(end);
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [sessions, searchQuery, filters]);

  const formatDateRange = (start?: string | Date, end?: string | Date) => {
    if (!start && !end) return "—";
    const startDate = start ? new Date(start).toLocaleDateString("pt-PT") : "...";
    const endDate = end ? new Date(end).toLocaleDateString("pt-PT") : "...";
    return `${startDate} → ${endDate}`;
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{dict.table.title}</th>
            <th>
              <div className={styles.headerWithFilter}>
                {dict.table.type}
                <button
                  ref={typeFilterRef}
                  className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTypeFilter();
                  }}>
                  <TbFilter size={16} />
                </button>
              </div>
            </th>
            <th>
              <div className={styles.headerWithFilter}>
                {dict.table.period}
                <button
                  ref={dateFilterRef}
                  className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDateFilter();
                  }}>
                  <TbFilter size={16} />
                </button>
              </div>
            </th>
            <th>{dict.table.voters}</th>
            <th>
              <div className={styles.headerWithFilter}>
                {dict.table.status}
                <button
                  ref={statusFilterRef}
                  className={`${styles.headerFilterBtn} ${styles.desktopOnly}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatusFilter();
                  }}>
                  <TbFilter size={16} />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSessions.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.empty}>
                {dict.table.empty}
              </td>
            </tr>
          ) : (
            filteredSessions.map((session) => (
              <tr key={session.id} className={styles.row} onClick={() => onRowClick(session)}>
                <td className={styles.cell}>
                  <div className={styles.titleCell}>
                    <span className={styles.name}>{session.name}</span>
                    {session.description && (
                      <span className={styles.description}>{session.description}</span>
                    )}
                  </div>
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[session.type]}`}>
                    {dict.types[session.type]}
                  </span>
                </td>
                <td className={styles.cell}>
                  <span className={styles.period}>
                    {formatDateRange(session.startAt, session.endAt)}
                  </span>
                </td>
                <td className={styles.cell}>
                  <span className={styles.votes}>{session.totalVotes || "0"}</span>
                </td>
                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[session.status]}`}>
                    {dict.statuses[session.status]}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
