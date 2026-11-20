import { db_query } from "@/lib/db/connection";
import { CampusScheduleSlot } from "@/types/schedule";
import { cacheTag, revalidateTag } from "next/cache";

export const getCampusScheduleSlotsNoCache = async (
  campus?: string
): Promise<CampusScheduleSlot[]> => {
  const { rows } = await db_query<CampusScheduleSlot>(
    `SELECT * FROM neiist.get_campus_schedule_slots($1)`,
    [campus ?? null]
  );
  return rows;
};

export const getCampusScheduleSlots = async (campus?: string): Promise<CampusScheduleSlot[]> => {
  "use cache";
  cacheTag("campus-schedules");
  return getCampusScheduleSlotsNoCache(campus);
};

export const setCampusScheduleSlots = async (
  campus: string,
  slots: { day_of_week: number; start_time: string; end_time: string }[]
): Promise<CampusScheduleSlot[]> => {
  const campusClean = campus.trim().toLowerCase();

  const { rows } = await db_query<CampusScheduleSlot>(
    `SELECT * FROM neiist.set_campus_schedule_slots($1, $2::JSONB)`,
    [campusClean, JSON.stringify(slots)]
  );

  revalidateTag("campus-schedules", "max");
  return rows;
};
