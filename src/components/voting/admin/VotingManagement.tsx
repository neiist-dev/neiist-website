"use client";

import React, { useMemo, useRef, useState } from "react";
import { VotingSession, VotingType, VotingStatus } from "@/types/voting";
import { CalendarEvent } from "@/types/events";
import { User } from "@/types/user";
import { FiSearch, FiPlus } from "react-icons/fi";
import { TbFilter } from "react-icons/tb";
import { useRouter, useSearchParams } from "next/navigation";
import VotingSessionsTable, {
  TYPE_LABELS,
  STATUS_LABELS,
} from "@/components/voting/admin/VotingSessionsTable";
import MultiSelectFilter from "@/components/shop/MultiSelectFilter";
import DateFilter from "@/components/shop/DateFilter";
import ActiveFilters from "@/components/shop/ActiveFilters";
import MobileFiltersDrawer from "@/components/shop/MobileFiltersDrawer";
import ColorfulText from "@/components/ColorfulText";
import styles from "@/styles/components/voting/admin/VotingManagement.module.css";

interface VotingManagementProps {
  initialSessions: VotingSession[];
  activities: CalendarEvent[];
  users: User[];
}

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  type: VotingType[];
  status: VotingStatus[];
}

export default function VotingManagement({ initialSessions }: VotingManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    type: [],
    status: [],
  });

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  const dateFilterRef = useRef<HTMLButtonElement>(null);
  const typeFilterRef = useRef<HTMLButtonElement>(null);
  const statusFilterRef = useRef<HTMLButtonElement>(null);

  const availableTypes = useMemo(() => {
    const typeSet = new Set<VotingType>();
    initialSessions.forEach((s) => typeSet.add(s.type));
    return Array.from(typeSet).sort();
  }, [initialSessions]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<VotingStatus>();
    initialSessions.forEach((s) => statusSet.add(s.status));
    return Array.from(statusSet).sort();
  }, [initialSessions]);

  const handleCreateNew = () => {
    router.push("/voting/manage/new");
  };

  const handleRowClick = (session: VotingSession) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sessionId", String(session.id));
    router.push(`?${params.toString()}`);
  };

  const handleClearAll = () => {
    setFilters({
      dateRange: { start: null, end: null },
      type: [],
      status: [],
    });
  };

  return (
    <>
      <section className={styles.container}>
        <ColorfulText text={"Gestão de Votações"} className={styles.title} />

        <div className={styles.controlsRow}>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>
              <FiSearch size={18} />
            </div>
            <input
              type="text"
              placeholder="Procurar por título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
              title="Filtros">
              <TbFilter size={20} />
            </button>
          </div>
          <div className={styles.rightControls}>
            <button type="button" onClick={handleCreateNew} className={styles.newBtn}>
              <FiPlus />
              Nova Sessão
            </button>
          </div>
        </div>

        <div className={styles.desktopOnly}>
          <ActiveFilters
            dateRange={filters.dateRange}
            onRemoveDateRange={() =>
              setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
            }
            filterGroups={[
              {
                id: "type",
                label: "Tipo",
                values: filters.type,
                getDisplayValue: (t) => TYPE_LABELS[t as VotingType],
              },
              {
                id: "status",
                label: "Estado",
                values: filters.status,
                getDisplayValue: (s) => STATUS_LABELS[s as VotingStatus],
              },
            ]}
            onRemoveValue={(groupId, value) => {
              setFilters((prev) => ({
                ...prev,
                [groupId]: (prev[groupId as keyof FilterState] as string[]).filter(
                  (x) => x !== value
                ),
              }));
            }}
            onClearAll={handleClearAll}
          />
        </div>

        <div className={styles.card}>
          <VotingSessionsTable
            sessions={initialSessions}
            searchQuery={searchQuery}
            filters={filters}
            onRowClick={handleRowClick}
            onToggleTypeFilter={() => setTypeFilterOpen(!typeFilterOpen)}
            onToggleStatusFilter={() => setStatusFilterOpen(!statusFilterOpen)}
            onToggleDateFilter={() => setDateFilterOpen(!dateFilterOpen)}
            typeFilterRef={typeFilterRef}
            statusFilterRef={statusFilterRef}
            dateFilterRef={dateFilterRef}
          />
        </div>
      </section>

      {dateFilterOpen && (
        <DateFilter
          isOpen={dateFilterOpen}
          onClose={() => setDateFilterOpen(false)}
          dateRange={filters.dateRange}
          onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
          buttonRef={dateFilterRef}
        />
      )}

      {typeFilterOpen && (
        <MultiSelectFilter
          isOpen={typeFilterOpen}
          onClose={() => setTypeFilterOpen(false)}
          options={availableTypes}
          selected={filters.type}
          onChange={(type) => setFilters((p) => ({ ...p, type: type as VotingType[] }))}
          buttonRef={typeFilterRef}
          title="Tipo"
          getLabel={(t) => TYPE_LABELS[t as VotingType]}
        />
      )}

      {statusFilterOpen && (
        <MultiSelectFilter
          isOpen={statusFilterOpen}
          onClose={() => setStatusFilterOpen(false)}
          options={availableStatuses}
          selected={filters.status}
          onChange={(status) => setFilters((p) => ({ ...p, status: status as VotingStatus[] }))}
          buttonRef={statusFilterRef}
          title="Estado"
          getLabel={(s) => STATUS_LABELS[s as VotingStatus]}
        />
      )}

      <MobileFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        initialFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters as FilterState);
          setShowMobileFilters(false);
        }}
        filterGroups={[
          {
            id: "type",
            title: "Tipo",
            options: availableTypes,
            selected: filters.type,
            getLabel: (t) => TYPE_LABELS[t as VotingType],
          },
          {
            id: "status",
            title: "Estado",
            options: availableStatuses,
            selected: filters.status,
            getLabel: (s) => STATUS_LABELS[s as VotingStatus],
          },
        ]}
      />
    </>
  );
}
