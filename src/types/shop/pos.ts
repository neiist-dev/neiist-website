export interface PosStation {
  id: string;
  name: string;
  location: string;
  active: boolean;
  created_at: string;
}

export type PosShiftStatus = "open" | "closed";

export interface PosShift {
  id: string;
  station_id: string;
  opened_by: string;
  initial_float: number;
  final_cash_counted?: number;
  expected_cash?: number;
  cash_variance?: number;
  status: PosShiftStatus;
  opened_at: string;
  closed_at?: string;
  closed_by?: string;
  station_name: string;
  station_location: string;
  opened_by_name: string;
  closed_by_name?: string;
}

export interface dbPosShift {
  id: string;
  station_id: string;
  opened_by: string;
  initial_float: string | number;
  final_cash_counted: string | number | null;
  expected_cash: string | number | null;
  cash_variance: string | number | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  station_name?: string | null;
  station_location?: string | null;
  opened_by_name?: string | null;
  closed_by_name?: string | null;
}
