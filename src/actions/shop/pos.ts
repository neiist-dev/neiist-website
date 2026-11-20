"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  getAllStations,
  createStation,
  updateStation,
  openShift,
  closeShift,
  getActiveShiftForStation,
  getShiftsHistory,
} from "@/lib/db/repositories/pos.repository";
import { PosStation, PosShift } from "@/types/shop/pos";
import { Order } from "@/types/shop/order";

import { toCents, fromCents } from "@/utils/shop/moneyUtils";

export async function getAllStationsAction(): Promise<PosStation[]> {
  await requirePermission("pos:access");
  return await getAllStations();
}

export async function getActiveShiftAction(stationId: string): Promise<PosShift | null> {
  await requirePermission("pos:access");
  return await getActiveShiftForStation(stationId);
}

export async function openShiftAction(stationId: string, initialFloat: number): Promise<PosShift> {
  const session = await requirePermission("pos:access");
  const floatCents = toCents(initialFloat);
  if (isNaN(floatCents) || floatCents < 0)
    throw new Error("O fundo de maneio inicial deve ser um valor positivo ou zero.");

  const sanitizedFloat = fromCents(floatCents);

  const opened = await openShift(stationId, session.user.istid, sanitizedFloat);
  if (!opened) throw new Error("Falha ao abrir turno");

  revalidateTag("pos_shifts", "max");
  revalidatePath("/shop/pos");
  revalidatePath("/shop/pos/live");
  revalidatePath("/shop/pos/manage");
  return opened;
}

export async function saveStationAction(station: {
  id?: string;
  name: string;
  location: string;
  active?: boolean;
}): Promise<PosStation> {
  await requirePermission("pos:manage");
  const saved = station.id
    ? await updateStation(station.id, {
        name: station.name,
        location: station.location,
        active: station.active,
      })
    : await createStation(station.name, station.location);

  if (!saved) throw new Error("Falha ao guardar posto POS");
  revalidateTag("pos_stations", "max");
  revalidatePath("/shop/pos");
  revalidatePath("/shop/pos/live");
  revalidatePath("/shop/pos/manage");
  return saved;
}

export async function closeShiftAction(
  shiftId: string,
  finalCashCounted: number
): Promise<PosShift> {
  const session = await requirePermission("pos:access");
  const cashCents = toCents(finalCashCounted);
  if (isNaN(cashCents) || cashCents < 0)
    throw new Error("O valor de caixa contado deve ser um valor positivo ou zero.");

  const sanitizedCash = fromCents(cashCents);

  const closed = await closeShift(shiftId, sanitizedCash, session.user.istid);
  if (!closed) throw new Error("Falha ao fechar turno");

  revalidateTag("pos_shifts", "max");
  revalidatePath("/shop/pos");
  revalidatePath("/shop/pos/live");
  revalidatePath("/shop/pos/manage");
  return closed;
}

export async function getShiftsHistoryAction(limit: number = 50): Promise<PosShift[]> {
  await requirePermission("pos:manage");
  return await getShiftsHistory(limit);
}

export async function getUserPendingOrdersAction(userIstid: string): Promise<Order[]> {
  if (!userIstid) return [];
  await requirePermission("pos:access");
  const { getUserPendingOrders } = await import("@/lib/db/repositories/shop.repository");
  return await getUserPendingOrders(userIstid);
}
