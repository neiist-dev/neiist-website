import { db_query } from "@/lib/db/connection";
import { PosStation, PosShift, PosShiftStatus, dbPosShift } from "@/types/shop/pos";
import { parseDbNumeric } from "@/utils/shop/moneyUtils";
import { cacheTag, revalidateTag } from "next/cache";

export function mapdbPosStationToStation(row: PosStation): PosStation {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    active: Boolean(row.active),
    created_at: row.created_at,
  };
}

export function mapdbPosShiftToShift(row: dbPosShift): PosShift {
  return {
    id: row.id,
    station_id: row.station_id,
    opened_by: row.opened_by,
    initial_float: parseDbNumeric(row.initial_float),
    final_cash_counted:
      row.final_cash_counted != null ? parseDbNumeric(row.final_cash_counted) : undefined,
    expected_cash: row.expected_cash != null ? parseDbNumeric(row.expected_cash) : undefined,
    cash_variance: row.cash_variance != null ? parseDbNumeric(row.cash_variance) : undefined,
    status: row.status as PosShiftStatus,
    opened_at: row.opened_at,
    closed_at: row.closed_at ?? undefined,
    closed_by: row.closed_by ?? undefined,
    station_name: row.station_name || "Posto",
    station_location: row.station_location || "",
    opened_by_name: row.opened_by_name || row.opened_by,
    closed_by_name: row.closed_by_name ?? undefined,
  };
}

export const getAllStations = async (): Promise<PosStation[]> => {
  "use cache";
  cacheTag("pos_stations");
  const { rows } = await db_query<PosStation>(`SELECT * FROM neiist.get_pos_stations(NULL::UUID)`);
  return rows.map(mapdbPosStationToStation);
};

export const createStation = async (name: string, location: string): Promise<PosStation> => {
  const {
    rows: [row],
  } = await db_query<PosStation>(`SELECT * FROM neiist.create_pos_station($1, $2, TRUE)`, [
    name,
    location,
  ]);
  revalidateTag("pos_stations", "max");
  return mapdbPosStationToStation(row);
};

export const updateStation = async (
  id: string,
  updates: { name?: string; location?: string; active?: boolean }
): Promise<PosStation | null> => {
  const {
    rows: [row],
  } = await db_query<PosStation>(`SELECT * FROM neiist.update_pos_station($1::UUID, $2, $3, $4)`, [
    id,
    updates.name ?? null,
    updates.location ?? null,
    updates.active ?? null,
  ]);
  revalidateTag("pos_stations", "max");
  revalidateTag(`station-${id}`, "max");
  return row ? mapdbPosStationToStation(row) : null;
};

export const getActiveShiftForStation = async (stationId: string): Promise<PosShift | null> => {
  const {
    rows: [row],
  } = await db_query<dbPosShift>(
    `SELECT * FROM neiist.get_pos_shifts(NULL, $1::UUID, 'open'::neiist.pos_shift_status_enum, 1)`,
    [stationId]
  );
  return row ? mapdbPosShiftToShift(row) : null;
};

export const getShiftById = async (shiftId: string): Promise<PosShift | null> => {
  const {
    rows: [row],
  } = await db_query<dbPosShift>(`SELECT * FROM neiist.get_pos_shifts($1::UUID, NULL, NULL, 1)`, [
    shiftId,
  ]);
  return row ? mapdbPosShiftToShift(row) : null;
};

export const openShift = async (
  stationId: string,
  openedBy: string,
  initialFloat: number
): Promise<PosShift> => {
  const {
    rows: [row],
  } = await db_query<dbPosShift>(`SELECT * FROM neiist.open_pos_shift($1::UUID, $2, $3::NUMERIC)`, [
    stationId,
    openedBy,
    initialFloat,
  ]);
  revalidateTag("pos_shifts", "max");
  return mapdbPosShiftToShift(row);
};

export const closeShift = async (
  shiftId: string,
  finalCashCounted: number,
  closedBy: string
): Promise<PosShift> => {
  const {
    rows: [row],
  } = await db_query<dbPosShift>(
    `SELECT * FROM neiist.close_pos_shift($1::UUID, $2::NUMERIC, $3)`,
    [shiftId, finalCashCounted, closedBy]
  );
  revalidateTag("pos_shifts", "max");
  return mapdbPosShiftToShift(row);
};

export const getShiftsHistory = async (limit: number = 50): Promise<PosShift[]> => {
  const { rows } = await db_query<dbPosShift>(
    `SELECT * FROM neiist.get_pos_shifts(NULL, NULL, NULL, $1::INT)`,
    [limit]
  );
  return rows.map(mapdbPosShiftToShift);
};
