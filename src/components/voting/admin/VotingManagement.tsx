"use client";

import React, { useMemo, useRef, useState } from "react";
import { VotingSession, VotingType, VotingStatus } from "@/types/voting";
import { FiPlus } from "react-icons/fi";
import { TbFilter } from "react-icons/tb";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SearchInput,
  Button,
  TableActiveFilters,
  TableFilterMultiSelect,
  TableFilterDate,
  TableFiltersDrawer,
} from "@neiist/ui";
import { pt, enGB } from "date-fns/locale";
import VotingSessionsTable from "@/components/voting/admin/VotingSessionsTable";
import ColorfulText from "@/components/ColorfulText";
import { useSearch } from "@/hooks/useSearch";
import styles from "@/styles/components/voting/admin/VotingManagement.module.css";
import type { Dictionary } from "@/i18n/dictionaries";

interface VotingManagementProps {
  initialSessions: VotingSession[];
  dict: Dictionary["voting_management"];
  locale?: string;
  basePath?: string;
}

interface FilterState {
  dateRange: { start: Date | null; end: Date | null };
  type: VotingType[];
  status: VotingStatus[];
}

export default function VotingManagement({
  initialSessions,
  dict,
  locale = "pt",
  basePath,
}: VotingManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const dateLocale = locale === "en" ? enGB : pt;

  const {
    results: searchedSessions,
    query: searchQuery,
    setQuery: setSearchQuery,
  } = useSearch<VotingSession>({
    data: initialSessions,
    fields: [{ field: "name", boost: 3 }, "description"],
    returnAllWhenEmpty: true,
  });

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
    router.push(`${basePath || ""}/voting/manage/new`);
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
        <ColorfulText text={dict.title} className={styles.title} />

        <div className={styles.controlsRow}>
          <div className={styles.searchWrapper}>
            <SearchInput
              placeholder={dict.search_placeholder}
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setShowMobileFilters(true)}
              title={dict.filters_button}>
              <TbFilter size={20} />
            </button>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className={styles.newButton}
            onClick={handleCreateNew}>
            <FiPlus />
            {dict.new_session}
          </Button>
        </div>

        <TableActiveFilters
          dateRange={filters.dateRange}
          onRemoveDateRange={() =>
            setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
          }
          filterGroups={[
            {
              id: "type",
              label: dict.filter_type,
              values: filters.type,
              getDisplayValue: (t) => dict.types[t as VotingType],
            },
            {
              id: "status",
              label: dict.filter_status,
              values: filters.status,
              getDisplayValue: (s) => dict.statuses[s as VotingStatus],
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
          label={dict.filter_labels.filters}
          clearLabel={dict.filter_labels.clear_all}
        />

        <VotingSessionsTable
          sessions={searchedSessions}
          filters={filters}
          onRowClick={handleRowClick}
          onToggleTypeFilter={() => setTypeFilterOpen(!typeFilterOpen)}
          onToggleStatusFilter={() => setStatusFilterOpen(!statusFilterOpen)}
          onToggleDateFilter={() => setDateFilterOpen(!dateFilterOpen)}
          typeFilterRef={typeFilterRef}
          statusFilterRef={statusFilterRef}
          dateFilterRef={dateFilterRef}
          dict={dict}
          locale={locale}
        />
      </section>

      {dateFilterOpen && (
        <TableFilterDate
          isOpen={dateFilterOpen}
          onClose={() => setDateFilterOpen(false)}
          dateRange={filters.dateRange}
          onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
          buttonRef={dateFilterRef}
          titleLabel={dict.table.period}
          untilDateLabel={dict.filter_labels.until}
          rangeLabel={dict.filter_labels.range}
          clearLabel={dict.filter_labels.clear}
          applyLabel={dict.filter_labels.apply}
          drawerTitle={dict.table.period}
          locale={dateLocale}
        />
      )}

      {typeFilterOpen && (
        <TableFilterMultiSelect
          isOpen={typeFilterOpen}
          onClose={() => setTypeFilterOpen(false)}
          options={availableTypes}
          selected={filters.type}
          onChange={(type) => setFilters((p) => ({ ...p, type: type as VotingType[] }))}
          buttonRef={typeFilterRef}
          title={dict.filter_type}
          getLabel={(t) => dict.types[t as VotingType]}
          clearLabel={dict.filter_labels.clear}
          applyLabel={dict.filter_labels.apply}
        />
      )}

      {statusFilterOpen && (
        <TableFilterMultiSelect
          isOpen={statusFilterOpen}
          onClose={() => setStatusFilterOpen(false)}
          options={availableStatuses}
          selected={filters.status}
          onChange={(status) => setFilters((p) => ({ ...p, status: status as VotingStatus[] }))}
          buttonRef={statusFilterRef}
          title={dict.filter_status}
          getLabel={(s) => dict.statuses[s as VotingStatus]}
          clearLabel={dict.filter_labels.clear}
          applyLabel={dict.filter_labels.apply}
        />
      )}

      <TableFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title={dict.filters_button}
        closeAriaLabel={dict.filter_labels.close}
        dateRange={filters.dateRange}
        dateFilterTitle={dict.table.period}
        untilDateLabel={dict.filter_labels.until}
        rangeLabel={dict.filter_labels.range}
        clearLabel={dict.filter_labels.clear_all}
        applyLabel={dict.filter_labels.apply}
        locale={dateLocale}
        categories={[
          {
            id: "type",
            title: dict.filter_type,
            options: availableTypes.map((t) => ({ label: dict.types[t], value: t })),
            selected: filters.type,
          },
          {
            id: "status",
            title: dict.filter_status,
            options: availableStatuses.map((s) => ({ label: dict.statuses[s], value: s })),
            selected: filters.status,
          },
        ]}
        onApply={({ dateRange, categories }) => {
          setFilters({
            dateRange,
            type: (categories.type || []) as VotingType[],
            status: (categories.status || []) as VotingStatus[],
          });
          setShowMobileFilters(false);
        }}
      />
    </>
  );
}
