"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Tabs, type TabItem, Alert, ColorfulText } from "@neiist/ui";
import { PublicCampusScheduleSlot } from "@/types/schedule";
import { PosStation } from "@/types/shop/pos";
import { getCampusScheduleSlotsAction, saveCampusScheduleSlotsAction } from "@/actions/schedules";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/manage/CampusSchedulesManagement.module.css";

interface CampusSchedulesManagementProps {
  stations?: PosStation[];
  dict: Dictionary["campus_schedules_management"];
}

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7];

// Hours displayed in the availability matrix (9:00 to 20:00)
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Get slots of 30min block keys `${day_of_week}-${HH:mm}`
 * */
function slotsToBlockKeys(slots: PublicCampusScheduleSlot[]): Set<string> {
  const keys = new Set<string>();
  for (const slot of slots) {
    const startMins = timeToMinutes(slot.start_time);
    const endMins = timeToMinutes(slot.end_time);
    for (let m = startMins; m < endMins; m += 30) {
      keys.add(`${slot.day_of_week}-${minutesToTime(m)}`);
    }
  }
  return keys;
}

/**
 * Get DB time from teh 30min block keys
 * */
function blockKeysToMergedSlots(
  keys: Set<string>
): { day_of_week: number; start_time: string; end_time: string }[] {
  const result: { day_of_week: number; start_time: string; end_time: string }[] = [];

  for (const dayValue of DAY_VALUES) {
    const dayMins: number[] = [];
    for (const key of keys) {
      const [d, timeStr] = key.split("-");
      if (Number(d) === dayValue) dayMins.push(timeToMinutes(timeStr));
    }

    if (dayMins.length === 0) continue;

    dayMins.sort((a, b) => a - b);

    let currentStart = dayMins[0];
    let currentEnd = dayMins[0] + 30;

    for (let i = 1; i < dayMins.length; i++) {
      const nextMin = dayMins[i];
      if (nextMin === currentEnd) {
        currentEnd += 30;
      } else {
        result.push({
          day_of_week: dayValue,
          start_time: minutesToTime(currentStart),
          end_time: minutesToTime(currentEnd),
        });
        currentStart = nextMin;
        currentEnd = nextMin + 30;
      }
    }

    result.push({
      day_of_week: dayValue,
      start_time: minutesToTime(currentStart),
      end_time: minutesToTime(currentEnd),
    });
  }

  return result;
}

export default function CampusSchedulesManagement({
  stations,
  dict,
}: CampusSchedulesManagementProps) {
  const initialCampus = useMemo(() => {
    if (stations && stations.length > 0) {
      const firstActive = stations.find((st) => st.active) || stations[0];
      return firstActive.name.toLowerCase().includes("tagus")
        ? "taguspark"
        : firstActive.name.toLowerCase().includes("alameda")
          ? "alameda"
          : firstActive.name.toLowerCase().trim();
    }
    return "alameda";
  }, [stations]);

  const [activeCampus, setActiveCampus] = useState<string>(initialCampus);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(() => new Set());

  const selectedBlocksRef = useRef<Set<string>>(selectedBlocks);
  selectedBlocksRef.current = selectedBlocks;

  const savedBlocksRef = useRef<Set<string>>(new Set());
  const debounceSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<"select" | "deselect">("select");

  const saveSlots = useCallback(
    async (campus: string, blocks: Set<string>) => {
      if (blocks.size === savedBlocksRef.current.size) {
        let isIdentical = true;
        for (const key of blocks) {
          if (!savedBlocksRef.current.has(key)) {
            isIdentical = false;
            break;
          }
        }
        if (isIdentical) return;
      }

      try {
        const intervals = blockKeysToMergedSlots(blocks);
        await saveCampusScheduleSlotsAction(campus, intervals);
        savedBlocksRef.current = new Set(blocks);
        Alert.success(dict.toast_saved);
      } catch (err: unknown) {
        Alert.error(err instanceof Error ? err.message : dict.toast_save_error);
      }
    },
    [dict.toast_saved, dict.toast_save_error]
  );

  const triggerDebouncedSave = useCallback(
    (campus: string, blocks: Set<string>) => {
      if (debounceSaveTimerRef.current) {
        clearTimeout(debounceSaveTimerRef.current);
      }
      debounceSaveTimerRef.current = setTimeout(() => {
        saveSlots(campus, blocks);
      }, 800);
    },
    [saveSlots]
  );

  const fetchSlots = useCallback(
    async (campus: string) => {
      try {
        const data = await getCampusScheduleSlotsAction(campus);
        const blockSet = slotsToBlockKeys(data);
        setSelectedBlocks(blockSet);
        selectedBlocksRef.current = blockSet;
        savedBlocksRef.current = new Set(blockSet);
      } catch {
        setSelectedBlocks(new Set());
        selectedBlocksRef.current = new Set();
        savedBlocksRef.current = new Set();
        Alert.error(dict.toast_load_error);
      }
    },
    [dict.toast_load_error]
  );

  useEffect(() => {
    fetchSlots(activeCampus);
  }, [activeCampus, fetchSlots]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        triggerDebouncedSave(activeCampus, selectedBlocksRef.current);
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      if (debounceSaveTimerRef.current) {
        clearTimeout(debounceSaveTimerRef.current);
      }
    };
  }, [activeCampus, triggerDebouncedSave]);

  const handleSlotMouseDown = (day: number, timeStr: string) => {
    const key = `${day}-${timeStr}`;
    const willSelect = !selectedBlocksRef.current.has(key);
    dragModeRef.current = willSelect ? "select" : "deselect";
    isDraggingRef.current = true;

    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (willSelect) {
        next.add(key);
      } else {
        next.delete(key);
      }
      selectedBlocksRef.current = next;
      return next;
    });
  };

  const handleSlotMouseEnter = (day: number, timeStr: string) => {
    if (!isDraggingRef.current) return;
    const key = `${day}-${timeStr}`;
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (dragModeRef.current === "select") {
        next.add(key);
      } else {
        next.delete(key);
      }
      selectedBlocksRef.current = next;
      return next;
    });
  };

  const matrixGrid = useMemo(
    () => (
      <div className={styles.matrixWrapper}>
        <div className={styles.matrixTable}>
          <div className={styles.daysHeaderRow}>
            <div className={styles.timeGutterCorner} />
            {DAY_VALUES.map((dayValue, idx) => (
              <div key={dayValue} className={styles.dayHeaderCell}>
                {dict.days_short[idx]}
              </div>
            ))}
          </div>
          <div className={styles.matrixBody}>
            {HOURS.map((hour) => {
              const time00 = formatTime(hour, 0);
              const time30 = formatTime(hour, 30);

              return (
                <div key={hour} className={styles.hourRow}>
                  <div className={styles.timeLabelCell}>{time00}</div>
                  {DAY_VALUES.map((dayValue) => {
                    const key00 = `${dayValue}-${time00}`;
                    const key30 = `${dayValue}-${time30}`;
                    const isSelected00 = selectedBlocks.has(key00);
                    const isSelected30 = selectedBlocks.has(key30);
                    const prevKey00 = `${dayValue}-${formatTime(hour - 1, 30)}`;
                    const topRound00 = !selectedBlocks.has(prevKey00);
                    const bottomRound00 = !isSelected30;

                    const topRound30 = !isSelected00;
                    const nextKey30 = `${dayValue}-${formatTime(hour + 1, 0)}`;
                    const bottomRound30 = !selectedBlocks.has(nextKey30);

                    const slot00Class = [
                      styles.halfHourSlot,
                      isSelected00 ? styles.slotSelected : "",
                      isSelected00 && topRound00 ? styles.slotRoundTop : "",
                      isSelected00 && bottomRound00 ? styles.slotRoundBottom : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const slot30Class = [
                      styles.halfHourSlot,
                      isSelected30 ? styles.slotSelected : "",
                      isSelected30 && topRound30 ? styles.slotRoundTop : "",
                      isSelected30 && bottomRound30 ? styles.slotRoundBottom : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div key={dayValue} className={styles.dayColumnSlotPair}>
                        <div
                          className={slot00Class}
                          onMouseDown={() => handleSlotMouseDown(dayValue, time00)}
                          onMouseEnter={() => handleSlotMouseEnter(dayValue, time00)}
                        />
                        <div
                          className={slot30Class}
                          onMouseDown={() => handleSlotMouseDown(dayValue, time30)}
                          onMouseEnter={() => handleSlotMouseEnter(dayValue, time30)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    [selectedBlocks, dict.days_short]
  );

  const campusTabs: TabItem[] = useMemo(() => {
    if (stations && stations.length > 0) {
      return stations
        .filter((st) => st.active)
        .map((st) => {
          const campusKey = st.name.toLowerCase().includes("tagus")
            ? "taguspark"
            : st.name.toLowerCase().includes("alameda")
              ? "alameda"
              : st.name.toLowerCase().trim();
          return {
            id: campusKey,
            name: st.location ? `${st.name} (${st.location})` : st.name,
            content: matrixGrid,
          };
        });
    }
    return [
      { id: "alameda", name: dict.fallback_alameda, content: matrixGrid },
      { id: "taguspark", name: dict.fallback_taguspark, content: matrixGrid },
    ];
  }, [stations, matrixGrid, dict.fallback_alameda, dict.fallback_taguspark]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.title} />
        <p className={styles.subtitle}>{dict.subtitle}</p>
      </header>

      <Tabs
        tabs={campusTabs}
        value={activeCampus}
        onChange={(newCampus) => {
          if (debounceSaveTimerRef.current) {
            clearTimeout(debounceSaveTimerRef.current);
            saveSlots(activeCampus, selectedBlocksRef.current);
          }
          setActiveCampus(newCampus);
        }}
      />
    </main>
  );
}
