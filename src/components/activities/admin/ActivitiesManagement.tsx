"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  DataTable,
  ColumnDef,
  Button,
  Badge,
  SearchInput,
  ConfirmDialog,
  EmptyState,
  DropdownMenu,
  TableActiveFilters,
  TableFilterMultiSelect,
  TableFilterDate,
  TableFiltersDrawer,
  ColorfulText,
} from "@neiist/ui";
import { LuRefreshCw, LuPlus, LuQrCode, LuPencil, LuTrash2 } from "react-icons/lu";
import { TbFilter } from "react-icons/tb";
import { FiEye } from "react-icons/fi";
import { pt } from "date-fns/locale";
import EventDetails from "@/components/activities/EventDetails";
import { EVENT_TYPES } from "@/types/events";
import type { Activity } from "@/types/events";
import { deleteActivityAction } from "@/actions/activities";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/activities/admin/ActivitiesManagement.module.css";

interface ActivitiesManagementProps {
  events: Activity[];
  dict: Dictionary["activities_management"];
  detailsDict: Dictionary["activities"]["details"];
  basePath: string;
  locale?: string;
}

interface FilterState {
  type: string[];
  visibility: string[];
  status: string[];
  dateRange: { start: Date | null; end: Date | null };
}

export default function ActivitiesManagement({
  events,
  dict,
  detailsDict,
  basePath,
  locale = "pt",
}: ActivitiesManagementProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    type: [],
    visibility: [],
    status: [],
    dateRange: { start: null, end: null },
  });

  const [sortField, setSortField] = useState<"date" | "title">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [visibilityFilterOpen, setVisibilityFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const typeFilterRef = useRef<HTMLButtonElement | null>(null);
  const visibilityFilterRef = useRef<HTMLButtonElement | null>(null);
  const statusFilterRef = useRef<HTMLButtonElement | null>(null);
  const dateFilterRef = useRef<HTMLButtonElement | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Activity | null>(null);

  const [deleteEventTarget, setDeleteEventTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Synchronous Notion Sync Handler
  const handleSyncNotion = async () => {
    setIsSyncing(true);
    const alertId = Alert.loading(dict.syncing);
    try {
      const res = await fetch("/api/calendar/activities/sync", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || dict.sync_error);
      }
      const data = await res.json();
      Alert.success(data.message || dict.sync_success);
      router.refresh();
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : dict.sync_error);
    } finally {
      Alert.dismiss(alertId);
      setIsSyncing(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    const { id } = deleteEventTarget;
    setDeleteEventTarget(null);

    const alertId = Alert.loading("A apagar evento...");
    try {
      await deleteActivityAction(id);
      Alert.success("Evento apagado com sucesso");
      router.refresh();
    } catch (err) {
      Alert.error(err instanceof Error ? err.message : "Erro ao apagar evento");
    } finally {
      Alert.dismiss(alertId);
    }
  };

  const distinctTypes = useMemo(() => {
    const set = new Set<string>(EVENT_TYPES);
    for (const evt of events) {
      if (evt.type) set.add(evt.type);
    }
    return Array.from(set).sort();
  }, [events]);

  const filteredAndSortedEvents = useMemo(() => {
    const list = events.filter((evt) => {
      const isPub = evt.public;
      const isSignupEnabled = evt.signupEnabled;
      const evtType = evt.type || "";

      if (filters.visibility.length > 0) {
        const val = isPub ? "public" : "internal";
        if (!filters.visibility.includes(val)) return false;
      }

      if (filters.status.length > 0) {
        const val = isSignupEnabled ? "open" : "closed";
        if (!filters.status.includes(val)) return false;
      }

      if (filters.type.length > 0) {
        if (!filters.type.includes(evtType)) return false;
      }

      const { start, end } = filters.dateRange;
      if (evt.start) {
        const evtTime = new Date(evt.start).getTime();
        if (start && evtTime < new Date(start).setHours(0, 0, 0, 0)) return false;
        if (end && evtTime > new Date(end).setHours(23, 59, 59, 999)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (evt.title || "").toLowerCase();
        const loc = (
          Array.isArray(evt.location) ? evt.location.join(", ") : evt.location || ""
        ).toLowerCase();
        const typeStr = evtType.toLowerCase();
        if (!t.includes(q) && !loc.includes(q) && !typeStr.includes(q)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortField === "title") {
        const cmp = (a.title || "").localeCompare(b.title || "", "pt");
        return sortOrder === "asc" ? cmp : -cmp;
      }
      const dateA = a.start ? new Date(a.start).getTime() : 0;
      const dateB = b.start ? new Date(b.start).getTime() : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [events, filters, searchQuery, sortField, sortOrder]);

  const columns: ColumnDef<Activity>[] = useMemo(
    () => [
      {
        id: "title",
        header: dict.table.title,
        dataLabel: dict.table.title,
        isCardHeader: true,
        sortable: true,
        cell: (row) => <span className={styles.tableTitle}>{row.title}</span>,
      },
      {
        id: "type",
        header: dict.table.type,
        dataLabel: dict.table.type,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          typeFilterRef.current = ref.current;
          setTypeFilterOpen((v) => !v);
        },
        cell: (row) => row.type || "—",
      },
      {
        id: "date",
        header: dict.table.date,
        dataLabel: dict.table.date,
        sortable: true,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          dateFilterRef.current = ref.current;
          setDateFilterOpen((v) => !v);
        },
        cell: (row) => {
          return row.start
            ? new Date(row.start).toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";
        },
      },
      {
        id: "location",
        header: dict.table.location,
        dataLabel: dict.table.location,
        cell: (row) =>
          (Array.isArray(row.location) ? row.location.join(", ") : row.location) || "—",
      },
      {
        id: "visibility",
        header: dict.table.visibility,
        dataLabel: dict.table.visibility,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          visibilityFilterRef.current = ref.current;
          setVisibilityFilterOpen((v) => !v);
        },
        cell: (row) => {
          const isPub = row.public;
          return (
            <Badge variant={isPub ? "primary" : "outline"} size="sm">
              {isPub ? dict.table.public_badge : dict.table.internal_badge}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: dict.table.status,
        dataLabel: dict.table.status,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          statusFilterRef.current = ref.current;
          setStatusFilterOpen((v) => !v);
        },
        cell: (row) => {
          const isSignUp = row.signupEnabled;
          return (
            <Badge variant={isSignUp ? "secondary" : "outline"} size="sm">
              {isSignUp ? dict.table.open_badge : dict.table.closed_badge}
            </Badge>
          );
        },
      },
      {
        id: "attendees",
        header: dict.table.attendees,
        dataLabel: dict.table.attendees,
        cell: (row) => {
          const maxAttendees = row.maxAttendees;
          const subCount = row.subscriberCount ?? 0;
          return (
            <span>
              <strong>{subCount}</strong>
              {maxAttendees ? ` / ${maxAttendees}` : ""}
            </span>
          );
        },
      },
    ],
    [dict]
  );

  const renderActivityActions = useCallback(
    (row: Activity) => (
      <>
        <DropdownMenu.Item
          icon={<FiEye size={14} />}
          onClick={() => setSelectedEventForDetails(row)}>
          {dict.event_details}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          icon={<LuQrCode size={14} />}
          onClick={() => router.push(`${basePath}/activities/${row.id}/checkin`)}>
          {dict.open_scanner}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          icon={<LuPencil size={14} />}
          onClick={() => router.push(`${basePath}/activities/manage/${row.id}/edit`)}>
          {dict.edit_event}
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          icon={<LuTrash2 size={14} />}
          destructive
          onClick={() => setDeleteEventTarget({ id: row.id, title: row.title })}>
          {dict.delete_event}
        </DropdownMenu.Item>
      </>
    ),
    [basePath, dict.delete_event, dict.edit_event, dict.event_details, dict.open_scanner, router]
  );

  return (
    <div className={styles.container}>
      {deleteEventTarget && (
        <ConfirmDialog
          open={Boolean(deleteEventTarget)}
          message={dict.delete_confirm.replace("{title}", deleteEventTarget.title)}
          confirmLabel={dict.confirm_delete}
          cancelLabel={dict.cancel}
          isDestructive
          onConfirm={confirmDeleteEvent}
          onCancel={() => setDeleteEventTarget(null)}
        />
      )}

      <div className={styles.header}>
        <div className={styles.titleArea}>
          <ColorfulText as="h1" className={styles.title} text={dict.title} />
          <p className={styles.subtitle}>{dict.subtitle}</p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" onClick={handleSyncNotion} disabled={isSyncing}>
            <LuRefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? dict.syncing : dict.sync_notion}</span>
          </Button>

          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={() => router.push(`${basePath}/activities/manage/new`)}>
            <LuPlus size={16} />
            <span>{dict.create_event}</span>
          </Button>
        </div>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder={dict.search_placeholder}
            value={searchQuery}
            onChange={setSearchQuery}
            action={
              <button
                type="button"
                className={styles.mobileFilterBtn}
                onClick={() => setShowMobileFilters(true)}
                title={dict.table.filter_label}
                aria-label={dict.table.filter_label}>
                <TbFilter size={18} />
              </button>
            }
          />
        </div>
      </div>

      <TableActiveFilters
        dateRange={filters.dateRange}
        onRemoveDateRange={() =>
          setFilters((p) => ({ ...p, dateRange: { start: null, end: null } }))
        }
        filterGroups={[
          {
            id: "type",
            label: "Tipo",
            values: filters.type,
            getDisplayValue: (t) => t,
          },
          {
            id: "visibility",
            label: "Visibilidade",
            values: filters.visibility,
            getDisplayValue: (v) => (v === "public" ? "Público" : "Interno"),
          },
          {
            id: "status",
            label: "Inscrições",
            values: filters.status,
            getDisplayValue: (s) => (s === "open" ? "Abertas" : "Fechadas"),
          },
        ]}
        onRemoveValue={(groupId, value) => {
          setFilters((prev) => ({
            ...prev,
            [groupId]: (prev[groupId as keyof FilterState] as string[]).filter((x) => x !== value),
          }));
        }}
        onClearAll={() => {
          setFilters({
            type: [],
            visibility: [],
            status: [],
            dateRange: { start: null, end: null },
          });
        }}
        label={dict.table.filter_label}
        clearLabel={dict.table.clear_all}
      />

      <DataTable
        data={filteredAndSortedEvents}
        columns={columns}
        getRowId={(row) => row.id}
        sortField={sortField}
        sortDirection={sortOrder}
        onSortChange={(field, direction) => {
          setSortField(field as "date" | "title");
          setSortOrder(direction);
        }}
        onRowClick={(row) => router.push(`${basePath}/activities/manage/${row.id}`)}
        rowActions={renderActivityActions}
        actionsTitle={dict.table.actions}
        emptyMessage={
          <EmptyState title={dict.table.empty_title} description={dict.table.empty_desc} />
        }
      />

      {dateFilterOpen && (
        <TableFilterDate
          isOpen={dateFilterOpen}
          onClose={() => setDateFilterOpen(false)}
          dateRange={filters.dateRange}
          onChange={(range) => setFilters((p) => ({ ...p, dateRange: range }))}
          buttonRef={dateFilterRef}
          titleLabel={dict.table.date}
          untilDateLabel="Até"
          rangeLabel="Intervalo"
          clearLabel={dict.table.clear_all}
          applyLabel="Aplicar"
          drawerTitle={dict.table.date}
          locale={pt}
        />
      )}

      {typeFilterOpen && (
        <TableFilterMultiSelect
          isOpen={typeFilterOpen}
          onClose={() => setTypeFilterOpen(false)}
          options={distinctTypes}
          selected={filters.type}
          onChange={(types) => setFilters((p) => ({ ...p, type: types }))}
          buttonRef={typeFilterRef}
          title={dict.table.type}
          clearLabel={dict.table.clear_all}
          applyLabel="Aplicar"
        />
      )}

      {visibilityFilterOpen && (
        <TableFilterMultiSelect
          isOpen={visibilityFilterOpen}
          onClose={() => setVisibilityFilterOpen(false)}
          options={["public", "internal"]}
          selected={filters.visibility}
          onChange={(vis) => setFilters((p) => ({ ...p, visibility: vis }))}
          buttonRef={visibilityFilterRef}
          title={dict.table.visibility}
          getLabel={(val) =>
            val === "public" ? dict.table.public_badge : dict.table.internal_badge
          }
          clearLabel={dict.table.clear_all}
          applyLabel="Aplicar"
        />
      )}

      {statusFilterOpen && (
        <TableFilterMultiSelect
          isOpen={statusFilterOpen}
          onClose={() => setStatusFilterOpen(false)}
          options={["open", "closed"]}
          selected={filters.status}
          onChange={(st) => setFilters((p) => ({ ...p, status: st }))}
          buttonRef={statusFilterRef}
          title={dict.table.status}
          getLabel={(val) => (val === "open" ? dict.table.open_badge : dict.table.closed_badge)}
          clearLabel={dict.table.clear_all}
          applyLabel="Aplicar"
        />
      )}

      <TableFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title={dict.table.filter_label}
        closeAriaLabel={dict.table.clear_all}
        dateRange={filters.dateRange}
        dateFilterTitle={dict.table.date}
        untilDateLabel="Até"
        rangeLabel="Intervalo"
        clearLabel={dict.table.clear_all}
        applyLabel="Aplicar"
        locale={pt}
        categories={[
          {
            id: "type",
            title: dict.table.type,
            options: distinctTypes,
            selected: filters.type,
          },
          {
            id: "visibility",
            title: dict.table.visibility,
            options: [
              { label: dict.table.public_badge, value: "public" },
              { label: dict.table.internal_badge, value: "internal" },
            ],
            selected: filters.visibility,
          },
          {
            id: "status",
            title: dict.table.status,
            options: [
              { label: dict.table.open_badge, value: "open" },
              { label: dict.table.closed_badge, value: "closed" },
            ],
            selected: filters.status,
          },
        ]}
        onApply={({ dateRange, categories }) => {
          setFilters({
            dateRange,
            type: categories.type || [],
            visibility: categories.visibility || [],
            status: categories.status || [],
          });
          setShowMobileFilters(false);
        }}
      />

      {selectedEventForDetails && (
        <EventDetails
          event={selectedEventForDetails}
          onClose={() => setSelectedEventForDetails(null)}
          isSignedUp={false}
          onSignUpChange={() => {}}
          dict={detailsDict}
          locale={locale}
        />
      )}
    </div>
  );
}
