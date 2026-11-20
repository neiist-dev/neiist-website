"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Alert } from "@neiist/ui";
import { PosStation, PosShift } from "@/types/shop/pos";
import { formatShiftOpenedAt } from "@/utils/shop/posUtils";
import { getActiveShiftAction, openShiftAction, closeShiftAction } from "@/actions/shop/pos";
import type { Dictionary } from "@/i18n/dictionaries";

export function usePosSession({
  stations,
  storageKeys,
  dict,
}: {
  stations: PosStation[];
  storageKeys: string[];
  dict: Dictionary["pos"]["shift"];
}) {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || "");
  const [activeShift, setActiveShift] = useState<PosShift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [hasCheckedStation, setHasCheckedStation] = useState(false);
  const [stationSelectionConfirmed, setStationSelectionConfirmed] = useState(stations.length === 1);
  const currentStationReqRef = useRef(0);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState("");
  const [closingShift, setClosingShift] = useState(false);

  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId),
    [stations, selectedStationId]
  );

  const availableModalStations = useMemo(
    () => stations.filter((s) => s.active !== false),
    [stations]
  );

  const stationTooltipText = useMemo(() => {
    if (activeShift) {
      const openedStr = formatShiftOpenedAt(activeShift.opened_at, dict);
      const floatStr = Number(activeShift.initial_float || 0)
        .toFixed(2)
        .replace(".", ",");
      return dict.tooltip.replace("{opened}", openedStr).replace("{float}", floatStr);
    }
    return dict.session;
  }, [activeShift, dict]);

  const refreshShift = useCallback(async (stationId: string) => {
    if (!stationId) {
      setHasCheckedStation(true);
      return null;
    }
    const reqId = ++currentStationReqRef.current;
    setShiftLoading(true);
    try {
      const shift = await getActiveShiftAction(stationId);
      if (reqId === currentStationReqRef.current) setActiveShift(shift);

      return shift;
    } catch (err) {
      console.error("Failed to load active shift:", err);
      if (reqId === currentStationReqRef.current) setActiveShift(null);

      return null;
    } finally {
      if (reqId === currentStationReqRef.current) {
        setShiftLoading(false);
        setHasCheckedStation(true);
      }
    }
  }, []);

  useEffect(() => {
    let initialId = stations[0]?.id || "";
    for (const key of storageKeys) {
      const saved = localStorage.getItem(key);
      if (saved && stations.some((s) => s.id === saved)) {
        initialId = saved;
        break;
      }
    }
    setSelectedStationId(initialId);
    void refreshShift(initialId).then((shift) => {
      if (stations.length === 1 || shift) {
        setStationSelectionConfirmed(true);
      }
    });
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [stations]);

  const handleSelectStation = useCallback(
    (stationId: string) => {
      setSelectedStationId(stationId);
      if (typeof window !== "undefined") {
        for (const key of storageKeys) localStorage.setItem(key, stationId);
      }
      void refreshShift(stationId);
    },
    [storageKeys, refreshShift]
  );

  const confirmStationSelection = useCallback(() => {
    const targetId = selectedStationId || stations[0]?.id;
    if (targetId) {
      handleSelectStation(targetId);
      setStationSelectionConfirmed(true);
    }
  }, [selectedStationId, stations, handleSelectStation]);

  const handleOpenShift = async (floatValueStr: string) => {
    if (!selectedStationId) return;
    const floatAmount = parseFloat(floatValueStr.replace(",", "."));
    if (Number.isNaN(floatAmount) || floatAmount < 0) {
      Alert.error(dict.error_invalid_float);
      return;
    }

    try {
      const newShift = await openShiftAction(selectedStationId, floatAmount);
      Alert.success(dict.open_success);
      setIsOpenModalOpen(false);
      setActiveShift(newShift);
      await refreshShift(selectedStationId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.open_error;
      Alert.error(msg);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const countedAmount = parseFloat(countedCashInput.replace(",", "."));
    if (Number.isNaN(countedAmount) || countedAmount < 0) {
      Alert.error(dict.error_invalid_count);
      return;
    }

    setClosingShift(true);
    try {
      await closeShiftAction(activeShift.id, countedAmount);
      Alert.success(dict.close_success);
      setIsCloseModalOpen(false);
      setCountedCashInput("");
      setActiveShift(null);
      await refreshShift(selectedStationId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.close_error;
      Alert.error(msg);
    } finally {
      setClosingShift(false);
    }
  };

  return {
    selectedStationId,
    selectedStation,
    activeShift,
    setActiveShift,
    shiftLoading,
    hasCheckedAllStations: hasCheckedStation,
    stationSelectionConfirmed,
    setStationSelectionConfirmed,
    confirmStationSelection,
    availableModalStations,
    stationTooltipText,
    refreshShift,
    handleSelectStation,
    handleOpenShift,
    isOpenModalOpen,
    setIsOpenModalOpen,
    handleCloseShift,
    isCloseModalOpen,
    setIsCloseModalOpen,
    countedCashInput,
    setCountedCashInput,
    closingShift,
  };
}
