"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal, Text, Stack } from "@neiist/ui";
import { getCampusSchedule, PublicCampusScheduleSlot } from "@/types/schedule";
import { getCampusScheduleSlotsAction } from "@/actions/schedules";
import styles from "@/styles/components/shop/manage/modals/CampusScheduleOverlay.module.css";

export interface CampusScheduleOverlayDict {
  days?: string[];
  closed?: string;
  taguspark_location?: string;
  alameda_location?: string;
  title?: string;
  col_day?: string;
  col_hours?: string;
  help_text?: string;
}

interface CampusScheduleOverlayProps {
  open: boolean;
  onClose: () => void;
  campus?: string | null;
  dict?: unknown;
}

const DEFAULT_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export default function CampusScheduleOverlay({
  open,
  onClose,
  campus,
  dict,
}: CampusScheduleOverlayProps) {
  const [dbSlots, setDbSlots] = useState<PublicCampusScheduleSlot[]>([]);
  const overlayDict = (
    typeof dict === "object" && dict !== null
      ? ("shop" in dict &&
          typeof (dict as { shop: unknown }).shop === "object" &&
          (dict as { shop: { campus_schedule_overlay?: CampusScheduleOverlayDict } }).shop
            ?.campus_schedule_overlay) ||
        ("campus_schedule_overlay" in dict &&
          (dict as { campus_schedule_overlay?: CampusScheduleOverlayDict })
            .campus_schedule_overlay) ||
        dict
      : {}
  ) as CampusScheduleOverlayDict;

  const dayNames: string[] = Array.isArray(overlayDict?.days) ? overlayDict.days : DEFAULT_DAYS;
  const closedLabel = overlayDict?.closed ?? "Encerrado";

  useEffect(() => {
    if (!open || !campus) return;

    let cancelled = false;
    getCampusScheduleSlotsAction(campus)
      .then((slots) => {
        if (!cancelled) setDbSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setDbSlots([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, campus]);

  const staticScheduleInfo = useMemo(() => {
    return campus ? getCampusSchedule(campus) : null;
  }, [campus]);

  if (!open || !campus) return null;

  const isTagus = campus.toLowerCase() === "taguspark";
  const locationText = isTagus
    ? (overlayDict?.taguspark_location ?? "Sala do NEIIST Taguspark (1 - 4.14)")
    : (overlayDict?.alameda_location ?? "Sala do NEIIST Alameda (Pavilhão de Informática I 3.03)");

  const title = overlayDict?.title ?? "Horário de Funcionamento";
  const colDay = overlayDict?.col_day ?? "Dia";
  const colHours = overlayDict?.col_hours ?? "Horário";
  const helpText =
    overlayDict?.help_text ??
    "Podes pagar em numerário ou MBWay diretamente na sala durante os horários disponíveis.";

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={locationText}>
      <Stack direction="column" gap="md" className={styles.contentStack}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.th}>{colDay}</th>
              <th className={styles.th}>{colHours}</th>
            </tr>
          </thead>
          <tbody>
            {dbSlots.length > 0
              ? dayNames.map((dayName, idx) => {
                  const dayNum = idx + 1;
                  const slotsForDay = dbSlots.filter((s) => s.day_of_week === dayNum);
                  const isClosed = slotsForDay.length === 0;

                  return (
                    <tr key={dayName} className={styles.row}>
                      <td className={styles.td}>
                        <strong>{dayName}</strong>
                      </td>
                      <td className={styles.td}>
                        {isClosed
                          ? closedLabel
                          : slotsForDay
                              .map(
                                (s) =>
                                  `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`
                              )
                              .join(", ")}
                      </td>
                    </tr>
                  );
                })
              : staticScheduleInfo?.schedule.map((daySchedule, idx) => {
                  const isClosed = daySchedule.closed || daySchedule.slots.length === 0;
                  const dayLabel = dayNames[idx] ?? daySchedule.day;
                  return (
                    <tr key={daySchedule.day} className={styles.row}>
                      <td className={styles.td}>
                        <strong>{dayLabel}</strong>
                      </td>
                      <td className={styles.td}>
                        {isClosed
                          ? closedLabel
                          : daySchedule.slots
                              .map((slot) => `${slot.start} - ${slot.end}`)
                              .join(", ")}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        <Text variant="muted" className={styles.helpText}>
          {helpText}
        </Text>
      </Stack>
    </Modal>
  );
}
