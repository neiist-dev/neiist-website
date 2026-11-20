"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Text,
  Heading,
  Button,
  Input,
  Field,
  Badge,
  Modal,
  InputDialog,
  Tabs,
  DataTable,
  ColumnDef,
  SearchInput,
  DropdownMenu,
  TableFilterDate,
  TableFilterMultiSelect,
  TableActiveFilters,
  Alert,
  ColorfulText,
  Stack,
} from "@neiist/ui";
import { PosStation, PosShift } from "@/types/shop/pos";
import SumUpReadersManagement from "@/components/shop/manage/SumUpReadersManagement";
import PosShiftCloseModal from "@/components/shop/pos/modals/PosShiftCloseModal";
import {
  getAllStationsAction,
  saveStationAction,
  openShiftAction,
  closeShiftAction,
  getShiftsHistoryAction,
} from "@/actions/shop/pos";
import { formatMoney } from "@/utils/shop/moneyUtils";
import { formatPosTimestamp } from "@/utils/shop/posUtils";
import type { Dictionary } from "@/i18n/dictionaries";
import { FiPlus, FiPlayCircle, FiEdit2, FiSquare, FiInfo } from "react-icons/fi";
import { pt, enUS } from "date-fns/locale";
import styles from "@/styles/components/shop/pos/PosManagementHub.module.css";

interface PosManagementHubProps {
  initialStations: PosStation[];
  initialShifts: PosShift[];
  dict: Dictionary["pos"];
  sumupDict: Dictionary["sumup_readers"];
  locale: string;
}

export default function PosManagementHub({
  initialStations,
  initialShifts,
  dict,
  sumupDict,
  locale,
}: PosManagementHubProps) {
  const t = dict.management;
  const dateFnsLocale = locale === "en" ? enUS : pt;
  const [stations, setStations] = useState<PosStation[]>(initialStations);
  const [shiftsHistory, setShiftsHistory] = useState<PosShift[]>(initialShifts);
  const [activeTab, setActiveTab] = useState<string>("stations");

  const [stationSearch, setStationSearch] = useState("");
  const [shiftSearch, setShiftSearch] = useState("");

  const [shiftFilters, setShiftFilters] = useState<{
    stations: string[];
    statuses: string[];
    dateRange: { start: Date | null; end: Date | null };
  }>({
    stations: [],
    statuses: [],
    dateRange: { start: null, end: null },
  });

  const [shiftStationFilterOpen, setShiftStationFilterOpen] = useState(false);
  const [shiftStatusFilterOpen, setShiftStatusFilterOpen] = useState(false);
  const [shiftDateFilterOpen, setShiftDateFilterOpen] = useState(false);

  const shiftStationFilterRef = useRef<HTMLButtonElement | null>(null);
  const shiftStatusFilterRef = useRef<HTMLButtonElement | null>(null);
  const shiftDateFilterRef = useRef<HTMLButtonElement | null>(null);

  const [selectedShiftDetails, setSelectedShiftDetails] = useState<PosShift | null>(null);

  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<PosStation | null>(null);
  const [stationName, setStationName] = useState("");
  const [stationLocation, setStationLocation] = useState("");

  const [stationToOpen, setStationToOpen] = useState<PosStation | null>(null);

  const [shiftToClose, setShiftToClose] = useState<PosShift | null>(null);
  const [finalCashCounted, setFinalCashCounted] = useState("");
  const [closingShift, setClosingShift] = useState(false);

  const activeShiftsByStation = useMemo(() => {
    const map: Record<string, PosShift | null> = {};
    for (const shift of shiftsHistory)
      if (shift.status === "open" && !map[shift.station_id]) {
        map[shift.station_id] = shift;
      }
    return map;
  }, [shiftsHistory]);

  const refreshData = async () => {
    try {
      const [nextStations, nextShifts] = await Promise.all([
        getAllStationsAction(),
        getShiftsHistoryAction(50),
      ]);
      setStations(nextStations);
      setShiftsHistory(nextShifts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditStation = (st: PosStation) => {
    setEditingStation(st);
    setStationName(st.name);
    setStationLocation(st.location);
    setIsStationModalOpen(true);
  };

  const handleOpenCreateStation = () => {
    setEditingStation(null);
    setStationName("");
    setStationLocation("");
    setIsStationModalOpen(true);
  };

  const handleSaveStation = async () => {
    if (!stationName.trim() || !stationLocation.trim()) {
      Alert.error(t.errors.fill_all);
      return;
    }
    try {
      await saveStationAction({
        id: editingStation?.id,
        name: stationName.trim(),
        location: stationLocation.trim(),
        active: editingStation ? editingStation.active : true,
      });
      Alert.success(editingStation ? t.success.station_updated : t.success.station_created);
      setIsStationModalOpen(false);
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errors.save;
      Alert.error(msg);
    }
  };

  const handleOpenShift = async (floatValueStr: string) => {
    if (!stationToOpen || !floatValueStr.trim()) return;
    const floatVal = parseFloat(floatValueStr.replace(",", "."));
    if (isNaN(floatVal) || floatVal < 0) {
      Alert.error(t.errors.invalid_float);
      return;
    }
    try {
      await openShiftAction(stationToOpen.id, floatVal);
      Alert.success(t.success.shift_opened.replace("{station}", stationToOpen.name));
      setStationToOpen(null);
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errors.open;
      Alert.error(msg);
    }
  };

  const handleCloseShift = async () => {
    if (!shiftToClose || !finalCashCounted.trim()) return;
    const counted = parseFloat(finalCashCounted.replace(",", "."));
    if (isNaN(counted) || counted < 0) {
      Alert.error(t.errors.invalid_count);
      return;
    }
    setClosingShift(true);
    try {
      await closeShiftAction(shiftToClose.id, counted);
      Alert.success(t.success.shift_closed);
      setShiftToClose(null);
      setFinalCashCounted("");
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.errors.close;
      Alert.error(msg);
    } finally {
      setClosingShift(false);
    }
  };

  const formatDateDisplay = useCallback(
    (dateStr?: string | Date | null) => formatPosTimestamp(dateStr, t.today, locale),
    [t.today, locale]
  );

  const filteredStations = useMemo(() => {
    if (!stationSearch.trim()) return stations;
    const q = stationSearch.trim().toLowerCase();
    return stations.filter(
      (st) =>
        st.name.toLowerCase().includes(q) || (st.location && st.location.toLowerCase().includes(q))
    );
  }, [stations, stationSearch]);

  const renderStationMenuItems = useCallback(
    (st: PosStation) => {
      const activeShift = activeShiftsByStation[st.id];
      return (
        <>
          <DropdownMenu.Item icon={<FiEdit2 size={14} />} onClick={() => handleOpenEditStation(st)}>
            {t.edit_station_action}
          </DropdownMenu.Item>
          {activeShift ? (
            <DropdownMenu.Item
              icon={<FiSquare size={14} />}
              destructive
              onClick={() => {
                setShiftToClose(activeShift);
                setFinalCashCounted("");
              }}>
              {dict.desk.close_shift}
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              icon={<FiPlayCircle size={14} />}
              onClick={() => setStationToOpen(st)}>
              {dict.guard.open_shift}
            </DropdownMenu.Item>
          )}
        </>
      );
    },
    [activeShiftsByStation, t.edit_station_action, dict.desk.close_shift, dict.guard.open_shift]
  );

  const stationColumns = useMemo<ColumnDef<PosStation>[]>(
    () => [
      {
        id: "name",
        header: t.fields.station,
        dataLabel: t.fields.station,
        isCardHeader: true,
        cell: (st) => <strong>{st.name}</strong>,
      },
      {
        id: "location",
        header: t.fields.location,
        dataLabel: t.fields.location,
        cell: (st) => <Text size="sm">{st.location}</Text>,
      },
      {
        id: "shift",
        header: t.fields.shift_status,
        dataLabel: t.fields.shift,
        cell: (st) => {
          const activeShift = activeShiftsByStation[st.id];
          if (!activeShift) {
            return (
              <Text size="sm" variant="muted">
                {t.fields.no_active_shift}
              </Text>
            );
          }
          return (
            <Stack direction="column" gap="none">
              <Text size="sm">
                <strong>{activeShift.opened_by_name}</strong>
              </Text>
              <Text size="sm" variant="muted">
                {t.fields.since_float
                  .replace("{date}", formatDateDisplay(activeShift.opened_at))
                  .replace("{float}", activeShift.initial_float.toFixed(2))}
              </Text>
            </Stack>
          );
        },
      },
    ],
    [activeShiftsByStation, t, formatDateDisplay]
  );

  const uniqueShiftStations = useMemo(() => {
    const set = new Set<string>();
    shiftsHistory.forEach((s) => {
      if (s.station_name) set.add(s.station_name);
    });
    return Array.from(set).sort();
  }, [shiftsHistory]);

  const statusOptions = useMemo(() => ["open", "closed"], []);
  const getStatusLabel = useCallback(
    (val: string) => (val === "open" ? t.status_open : t.status_closed),
    [t.status_open, t.status_closed]
  );

  const filteredShifts = useMemo(() => {
    let list = shiftsHistory;

    if (shiftSearch.trim()) {
      const q = shiftSearch.trim().toLowerCase();
      list = list.filter((s) => {
        const stationMatch = s.station_name.toLowerCase().includes(q);
        const openedByMatch = s.opened_by_name.toLowerCase().includes(q);
        return stationMatch || openedByMatch;
      });
    }

    if (shiftFilters.stations.length > 0)
      list = list.filter((s) => s.station_name && shiftFilters.stations.includes(s.station_name));

    if (shiftFilters.statuses.length > 0)
      list = list.filter((s) => shiftFilters.statuses.includes(s.status));

    if (shiftFilters.dateRange.start) {
      const start = new Date(shiftFilters.dateRange.start);
      list = list.filter((s) => new Date(s.opened_at) >= start);
    }

    if (shiftFilters.dateRange.end) {
      const end = new Date(shiftFilters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      list = list.filter((s) => new Date(s.opened_at) <= end);
    }

    return list;
  }, [shiftsHistory, shiftSearch, shiftFilters]);

  const shiftFilterGroups = useMemo(() => {
    const groups = [];
    if (shiftFilters.stations.length > 0) {
      groups.push({
        id: "stations",
        label: t.fields.station,
        values: shiftFilters.stations,
      });
    }
    if (shiftFilters.statuses.length > 0) {
      groups.push({
        id: "statuses",
        label: t.fields.status,
        values: shiftFilters.statuses,
        getDisplayValue: getStatusLabel,
      });
    }
    return groups;
  }, [shiftFilters.stations, shiftFilters.statuses, t, getStatusLabel]);

  const handleRemoveShiftFilterValue = (groupId: string, val: string) => {
    setShiftFilters((prev) => ({
      ...prev,
      [groupId]: prev[groupId as "stations" | "statuses"].filter((v) => v !== val),
    }));
  };

  const handleClearAllShiftFilters = () => {
    setShiftFilters({
      stations: [],
      statuses: [],
      dateRange: { start: null, end: null },
    });
  };

  const renderShiftMenuItems = useCallback(
    (s: PosShift) => (
      <>
        <DropdownMenu.Item icon={<FiInfo size={14} />} onClick={() => setSelectedShiftDetails(s)}>
          {t.view_details}
        </DropdownMenu.Item>
        {s.status === "open" && (
          <DropdownMenu.Item
            icon={<FiSquare size={14} />}
            destructive
            onClick={() => {
              setShiftToClose(s);
              setFinalCashCounted("");
            }}>
            {dict.desk.close_shift}
          </DropdownMenu.Item>
        )}
      </>
    ),
    [t.view_details, dict.desk.close_shift]
  );

  const shiftColumns = useMemo<ColumnDef<PosShift>[]>(
    () => [
      {
        id: "station_name",
        header: t.fields.station,
        dataLabel: t.fields.station,
        isCardHeader: true,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          shiftStationFilterRef.current = ref.current;
          setShiftStationFilterOpen((prev) => !prev);
        },
        cell: (s) => <strong>{s.station_name || t.fields.station}</strong>,
      },
      {
        id: "status",
        header: t.fields.status,
        dataLabel: t.fields.status,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          shiftStatusFilterRef.current = ref.current;
          setShiftStatusFilterOpen((prev) => !prev);
        },
        cell: (s) => (
          <Badge variant={s.status === "open" ? "primary" : "secondary"}>
            {getStatusLabel(s.status)}
          </Badge>
        ),
      },
      {
        id: "opened_by",
        header: t.fields.opened_by,
        dataLabel: t.fields.opened_by,
        cell: (s) => s.opened_by_name,
      },
      {
        id: "opened_at",
        header: t.fields.opened_at,
        dataLabel: t.fields.opened_at,
        hasFilter: true,
        onFilterClick: (_e, ref) => {
          shiftDateFilterRef.current = ref.current;
          setShiftDateFilterOpen((prev) => !prev);
        },
        cell: (s) => formatDateDisplay(s.opened_at),
      },
      {
        id: "closed_at",
        header: t.fields.closed_at,
        dataLabel: t.fields.closed_at,
        cell: (s) => formatDateDisplay(s.closed_at),
      },
      {
        id: "initial_float",
        header: t.fields.float,
        dataLabel: t.fields.float,
        align: "end",
        cell: (s) => formatMoney(s.initial_float),
      },
      {
        id: "final_cash_counted",
        header: t.fields.final_count,
        dataLabel: t.fields.final_count,
        align: "end",
        cell: (s) => (s.final_cash_counted != null ? formatMoney(s.final_cash_counted) : "—"),
      },
      {
        id: "cash_variance",
        header: t.fields.variance,
        dataLabel: t.fields.variance,
        align: "end",
        cell: (s) => {
          const variance = s.cash_variance;
          if (variance == null) return "—";
          return `${variance > 0 ? "+" : ""}${formatMoney(variance)}`;
        },
      },
    ],
    [t, formatDateDisplay, getStatusLabel]
  );

  return (
    <main className={styles.container}>
      <Stack direction="column" gap="none">
        <ColorfulText as="h1" className={styles.title} text={t.title} />
        <Text variant="muted">{t.subtitle}</Text>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: "stations",
            name: t.tabs.stations,
            content: (
              <Stack direction="column" gap="md" className={styles.sectionBlock}>
                <Stack direction="column" gap="none">
                  <Heading level={3}>{t.stations_title}</Heading>
                  <Text size="sm" variant="muted">
                    {t.stations_subtitle}
                  </Text>
                </Stack>

                <div className={styles.controlsRow}>
                  <div className={styles.searchContainer}>
                    <SearchInput
                      placeholder={t.search_stations}
                      value={stationSearch}
                      onChange={setStationSearch}
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={handleOpenCreateStation}>
                    <FiPlus /> {t.new_station}
                  </Button>
                </div>

                <DataTable
                  data={filteredStations}
                  columns={stationColumns}
                  getRowId={(st) => st.id}
                  onRowClick={(st) => handleOpenEditStation(st)}
                  rowActions={renderStationMenuItems}
                  actionsTitle={t.actions_station_title}
                  emptyMessage={t.empty_stations}
                  responsive="cards"
                />
              </Stack>
            ),
          },
          {
            id: "shifts",
            name: t.tabs.shifts,
            content: (
              <Stack direction="column" gap="md" className={styles.sectionBlock}>
                <Stack direction="column" gap="none">
                  <Heading level={3}>{t.shifts_title}</Heading>
                  <Text size="sm" variant="muted">
                    {t.shifts_subtitle}
                  </Text>
                </Stack>

                <div className={styles.controlsRow}>
                  <div className={styles.searchContainer}>
                    <SearchInput
                      placeholder={t.search_shifts}
                      value={shiftSearch}
                      onChange={setShiftSearch}
                    />
                  </div>
                </div>

                {(shiftFilterGroups.length > 0 ||
                  shiftFilters.dateRange.start ||
                  shiftFilters.dateRange.end) && (
                  <TableActiveFilters
                    filterGroups={shiftFilterGroups}
                    dateRange={shiftFilters.dateRange}
                    onRemoveDateRange={() =>
                      setShiftFilters((prev) => ({
                        ...prev,
                        dateRange: { start: null, end: null },
                      }))
                    }
                    onRemoveValue={handleRemoveShiftFilterValue}
                    onClearAll={handleClearAllShiftFilters}
                    label={t.filters_active}
                    clearLabel={t.clear_all}
                  />
                )}

                <DataTable
                  data={filteredShifts}
                  columns={shiftColumns}
                  getRowId={(s) => s.id}
                  onRowClick={(s) => {
                    if (s.status === "open") {
                      setShiftToClose(s);
                      setFinalCashCounted("");
                    } else {
                      setSelectedShiftDetails(s);
                    }
                  }}
                  rowActions={renderShiftMenuItems}
                  actionsTitle={t.actions_shift_title}
                  emptyMessage={t.empty_shifts}
                  responsive="cards"
                />

                <TableFilterMultiSelect
                  isOpen={shiftStationFilterOpen}
                  onClose={() => setShiftStationFilterOpen(false)}
                  options={uniqueShiftStations}
                  selected={shiftFilters.stations}
                  onChange={(selected) =>
                    setShiftFilters((prev) => ({ ...prev, stations: selected }))
                  }
                  buttonRef={shiftStationFilterRef}
                  title={t.filter_station_title}
                  clearLabel={t.clear}
                  applyLabel={t.apply}
                />

                <TableFilterMultiSelect
                  isOpen={shiftStatusFilterOpen}
                  onClose={() => setShiftStatusFilterOpen(false)}
                  options={statusOptions}
                  selected={shiftFilters.statuses}
                  onChange={(selected) =>
                    setShiftFilters((prev) => ({ ...prev, statuses: selected }))
                  }
                  getLabel={getStatusLabel}
                  buttonRef={shiftStatusFilterRef}
                  title={t.filter_status_title}
                  clearLabel={t.clear}
                  applyLabel={t.apply}
                />

                <TableFilterDate
                  isOpen={shiftDateFilterOpen}
                  onClose={() => setShiftDateFilterOpen(false)}
                  dateRange={shiftFilters.dateRange}
                  onChange={(range) => setShiftFilters((prev) => ({ ...prev, dateRange: range }))}
                  buttonRef={shiftDateFilterRef}
                  locale={dateFnsLocale}
                  titleLabel={t.filter_date_title}
                  untilDateLabel={t.filter_until}
                  rangeLabel={t.filter_range}
                  clearLabel={t.clear}
                  applyLabel={t.apply}
                  drawerTitle={t.filter_date_drawer}
                />
              </Stack>
            ),
          },
          {
            id: "readers",
            name: t.tabs.readers,
            content: (
              <div className={styles.sectionBlock}>
                <SumUpReadersManagement dict={sumupDict} />
              </div>
            ),
          },
        ]}
      />

      {isStationModalOpen && (
        <Modal open={isStationModalOpen} onClose={() => setIsStationModalOpen(false)} size="md">
          <Modal.Header
            title={editingStation ? t.edit_station : t.new_station_title}
            onClose={() => setIsStationModalOpen(false)}
          />
          <Modal.Body>
            <Stack direction="column" gap="md">
              <Field label={t.station_name_label}>
                <Input
                  placeholder={t.station_name_placeholder}
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                />
              </Field>
              <Field label={t.station_location_label}>
                <Input
                  placeholder={t.station_location_placeholder}
                  value={stationLocation}
                  onChange={(e) => setStationLocation(e.target.value)}
                />
              </Field>
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={() => setIsStationModalOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="primary" onClick={handleSaveStation}>
              {t.save}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <InputDialog
        open={Boolean(stationToOpen)}
        title={t.open_shift_title.replace("{station}", stationToOpen?.name || "")}
        label={t.initial_float_label}
        type="number"
        initialValue="50.00"
        placeholder="50.00"
        confirmLabel={t.confirm_open}
        cancelLabel={t.cancel}
        onConfirm={(val) => void handleOpenShift(val)}
        onCancel={() => setStationToOpen(null)}
      />

      <PosShiftCloseModal
        open={Boolean(shiftToClose)}
        activeShift={shiftToClose}
        selectedStationName={shiftToClose?.station_name}
        countedCashInput={finalCashCounted}
        onCountedChange={setFinalCashCounted}
        closing={closingShift}
        onClose={() => setShiftToClose(null)}
        onConfirm={handleCloseShift}
        dict={dict.shift}
      />

      {selectedShiftDetails && (
        <Modal
          open={Boolean(selectedShiftDetails)}
          onClose={() => setSelectedShiftDetails(null)}
          size="md">
          <Modal.Header
            title={t.shift_details_title.replace(
              "{station}",
              selectedShiftDetails.station_name || t.fields.station
            )}
            onClose={() => setSelectedShiftDetails(null)}
          />
          <Modal.Body>
            <div className={styles.detailsGrid}>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.station}
                </Text>
                <strong>{selectedShiftDetails.station_name || "—"}</strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.status}
                </Text>
                <div>
                  <Badge variant={selectedShiftDetails.status === "open" ? "primary" : "secondary"}>
                    {getStatusLabel(selectedShiftDetails.status)}
                  </Badge>
                </div>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.opened_by}
                </Text>
                <strong>{selectedShiftDetails.opened_by_name}</strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.date_open}
                </Text>
                <strong>{formatDateDisplay(selectedShiftDetails.opened_at)}</strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.date_close}
                </Text>
                <strong>{formatDateDisplay(selectedShiftDetails.closed_at)}</strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.initial_float}
                </Text>
                <strong>{formatMoney(selectedShiftDetails.initial_float)}</strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.final_count}
                </Text>
                <strong>
                  {selectedShiftDetails.final_cash_counted != null
                    ? formatMoney(selectedShiftDetails.final_cash_counted)
                    : "—"}
                </strong>
              </Stack>
              <Stack direction="column" gap="none">
                <Text size="sm" variant="muted" className={styles.detailsLabel}>
                  {t.fields.variance_cash}
                </Text>
                <span>
                  {selectedShiftDetails.cash_variance != null ? (
                    <span
                      className={
                        selectedShiftDetails.cash_variance !== 0
                          ? selectedShiftDetails.cash_variance < 0
                            ? styles.varianceNegative
                            : styles.variancePositive
                          : styles.varianceZero
                      }>
                      {selectedShiftDetails.cash_variance > 0
                        ? `+${formatMoney(selectedShiftDetails.cash_variance)}`
                        : formatMoney(selectedShiftDetails.cash_variance)}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
              </Stack>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setSelectedShiftDetails(null)}>
              {t.close}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </main>
  );
}
