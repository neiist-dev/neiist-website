export interface TimeSlot {
  start: string;
  end: string;
  label?: string;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
  closed?: boolean;
}

export interface CampusScheduleInfo {
  location: string;
  schedule: DaySchedule[];
  notes?: string;
}

export type CampusSchedules = Record<string, CampusScheduleInfo>;

export const DEFAULT_CAMPUS_SCHEDULES: CampusSchedules = {
  alameda: {
    location: "Sala do NEIIST Alameda (Pavilhão de Informática I 3.03)",
    schedule: [
      {
        day: "Segunda-feira",
        slots: [
          { start: "10:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
      },
      {
        day: "Terça-feira",
        slots: [
          { start: "10:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
      },
      {
        day: "Quarta-feira",
        slots: [
          { start: "10:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
      },
      {
        day: "Quinta-feira",
        slots: [
          { start: "10:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
      },
      {
        day: "Sexta-feira",
        slots: [
          { start: "10:00", end: "13:00" },
          { start: "14:00", end: "18:00" },
        ],
      },
      {
        day: "Sábado",
        slots: [],
        closed: true,
      },
      {
        day: "Domingo",
        slots: [],
        closed: true,
      },
    ],
    notes: "Podes pagar em numerário ou MBWay diretamente na sala durante os horários disponíveis.",
  },
  taguspark: {
    location: "Sala do NEIIST Taguspark (1 - 4.14)",
    schedule: [
      {
        day: "Segunda-feira",
        slots: [{ start: "10:00", end: "17:00" }],
      },
      {
        day: "Terça-feira",
        slots: [{ start: "10:00", end: "17:00" }],
      },
      {
        day: "Quarta-feira",
        slots: [{ start: "10:00", end: "17:00" }],
      },
      {
        day: "Quinta-feira",
        slots: [{ start: "10:00", end: "17:00" }],
      },
      {
        day: "Sexta-feira",
        slots: [{ start: "10:00", end: "17:00" }],
      },
      {
        day: "Sábado",
        slots: [],
        closed: true,
      },
      {
        day: "Domingo",
        slots: [],
        closed: true,
      },
    ],
    notes: "Podes pagar em numerário ou MBWay diretamente na sala durante os horários disponíveis.",
  },
};
