"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  getCampusScheduleSlots,
  setCampusScheduleSlots,
} from "@/lib/db/repositories/campusSchedule.repository";
import { PublicCampusScheduleSlot } from "@/types/schedule";

export async function getCampusScheduleSlotsAction(
  campus?: string
): Promise<PublicCampusScheduleSlot[]> {
  return getCampusScheduleSlots(campus);
}

export async function saveCampusScheduleSlotsAction(
  campus: string,
  slots: { day_of_week: number; start_time: string; end_time: string }[]
): Promise<{ success: boolean }> {
  await requirePermission("shop:write");

  await setCampusScheduleSlots(campus, slots);

  revalidateTag("campus-schedules", "max");
  revalidatePath("/shop/manage/schedules");
  revalidatePath("/[locale]/shop/manage/schedules", "page");

  return { success: true };
}
