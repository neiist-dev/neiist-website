import type {
  CalendarMode,
  NormalizedCalendarEvent,
  CalendarDay,
  PositionedEvent,
  CalendarEvent,
} from "@/types/events";

export const truncateToDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return truncateToDay(c);
};

export const datesMatch = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getWeekStart = (d: Date) => addDays(d, -d.getDay());

export const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}h${String(date.getMinutes()).padStart(2, "0")}`;

export const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

export const MONTH_NAMES = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1)
    .toLocaleString("pt-PT", { month: "long" })
    .replace(/^\w/u, (c) => c.toUpperCase())
);

export const DAY_NAMES = Array.from({ length: 7 }, (_, i) =>
  new Date(2000, 0, 2 + i)
    .toLocaleString("pt-PT", { weekday: "short" })
    .replace(/^\w/u, (c) => c.toUpperCase())
);

export function normalizeCalendarEvent(raw: CalendarEvent): NormalizedCalendarEvent | null {
  const startVal = raw?.start?.dateTime ?? raw?.start?.date;
  const endVal = raw?.end?.dateTime ?? raw?.end?.date ?? startVal;
  if (!startVal || !endVal) return null;

  const start = new Date(startVal);
  const end = new Date(endVal);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const isAllDay = Boolean(raw.start?.date && !raw.start?.dateTime);

  return {
    id: raw.id ?? `${startVal}-${raw.summary ?? "event"}`,
    summary: raw.summary ?? "Untitled Event",
    location: raw.location,
    isAllDay,
    start,
    end: isAllDay ? addDays(end, 1) : end,
    raw,
  };
}

export function formatEventDateTime(event: CalendarEvent): { date: string; time: string } {
  const startStr = event.start?.dateTime || event.start?.date;
  if (!startStr) return { date: "TBD", time: "" };

  const start = new Date(startStr);
  const isAllDay = !!event.start?.date;

  const time = isAllDay
    ? "All Day"
    : `${String(start.getHours()).padStart(2, "0")}h${String(start.getMinutes()).padStart(2, "0")}`;

  return { date: formatDate(start), time };
}

function occursOnDate(event: NormalizedCalendarEvent, target: Date) {
  const dayStart = truncateToDay(target).getTime();
  const eventStart = truncateToDay(event.start).getTime();
  const eventEnd = truncateToDay(event.end).getTime();
  return event.isAllDay
    ? dayStart >= eventStart && dayStart < eventEnd
    : dayStart >= eventStart && dayStart <= eventEnd;
}

function buildDays(
  start: Date,
  length: number,
  anchorMonth: number,
  today: Date,
  events: NormalizedCalendarEvent[]
): CalendarDay[] {
  return Array.from({ length }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      isCurrentMonth: date.getMonth() === anchorMonth,
      isToday: datesMatch(date, today),
      events: events.filter((e) => occursOnDate(e, date)),
    };
  });
}

function chunkIntoWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function collectWeekSpans(week: CalendarDay[]) {
  const spans = new Map<string, { event: NormalizedCalendarEvent; start: number; end: number }>();
  week.forEach((day, col) =>
    day.events.forEach((ev) => {
      const existing = spans.get(ev.id);
      if (existing) existing.end = col;
      else {
        const weekStartTime = truncateToDay(week[0].date).getTime();
        const evStartTime = truncateToDay(ev.start).getTime();
        spans.set(ev.id, { event: ev, start: evStartTime < weekStartTime ? 0 : col, end: col });
      }
    })
  );
  return Array.from(spans.values());
}

function positionEvents(weeks: CalendarDay[][]): PositionedEvent[] {
  const placed: PositionedEvent[] = [];
  weeks.forEach((week, weekIndex) => {
    const spans = collectWeekSpans(week).sort((a, b) =>
      a.start === b.start ? b.end - a.end : a.start - b.start
    );
    const occupancy: boolean[][] = [];
    for (const { event, start, end } of spans) {
      let row = occupancy.findIndex((r) => r.slice(start, end + 1).every((cell) => !cell));
      if (row === -1) {
        occupancy.push(new Array(7).fill(false));
        row = occupancy.length - 1;
      }
      for (let c = start; c <= end; c++) occupancy[row][c] = true;
      placed.push({ event, startCol: start, span: end - start + 1, row, weekIndex });
    }
  });
  return placed;
}

function getMaxRow(positions: PositionedEvent[]): number {
  return positions.length ? Math.max(...positions.map((p) => p.row)) + 1 : 0;
}

const formatWeekLabel = (start: Date) => {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear)
    return `${start.getDate()} - ${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
  if (sameYear)
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${start.getFullYear()}`;
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()} - ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
};

const format3DaysLabel = (days: CalendarDay[]) => {
  if (days.length < 3) return "";
  const s = days[0].date,
    e = days[2].date;
  return `${s.getDate()} - ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
};

export function buildView(
  mode: CalendarMode,
  anchorDate: Date,
  events: NormalizedCalendarEvent[],
  today: Date
):
  | { kind: "month"; label: string; days: CalendarDay[]; positions: PositionedEvent[] }
  | {
      kind: "week";
      label: string;
      days: CalendarDay[];
      timedEvents: NormalizedCalendarEvent[][];
      allDayPositions: PositionedEvent[];
      maxAllDayRows: number;
    }
  | {
      kind: "3days";
      label: string;
      days: CalendarDay[];
      timedEvents: NormalizedCalendarEvent[][];
    } {
  if (mode === "week") {
    const weekStart = getWeekStart(anchorDate);
    const days = buildDays(weekStart, 7, anchorDate.getMonth(), today, events);
    const allDayWeeks = [days.map((d) => ({ ...d, events: d.events.filter((e) => e.isAllDay) }))];
    const allDayPositions = positionEvents(allDayWeeks);
    return {
      kind: "week",
      label: formatWeekLabel(days[0].date),
      days,
      timedEvents: days.map((d) => d.events.filter((e) => !e.isAllDay)),
      allDayPositions,
      maxAllDayRows: getMaxRow(allDayPositions),
    };
  }

  if (mode === "3days") {
    const start = truncateToDay(anchorDate);
    const days = buildDays(start, 3, anchorDate.getMonth(), today, events);
    return {
      kind: "3days",
      label: format3DaysLabel(days),
      days,
      timedEvents: days.map((d) => d.events.filter((e) => !e.isAllDay)),
    };
  }

  const firstOfMonth = truncateToDay(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  const leading = firstOfMonth.getDay();
  const firstCell = addDays(firstOfMonth, -leading);
  const days = buildDays(firstCell, 42, anchorDate.getMonth(), today, events);
  const positions = positionEvents(chunkIntoWeeks(days));
  return {
    kind: "month",
    label: `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`,
    days,
    positions,
  };
}

export const stepDate = (anchor: Date, mode: CalendarMode, direction: number) => {
  if (mode === "3days") return addDays(anchor, direction * 3);
  if (mode === "week") return addDays(anchor, direction * 7);
  return truncateToDay(
    new Date(anchor.getFullYear(), anchor.getMonth() + direction, anchor.getDate())
  );
};

export const isWithinBounds = (
  candidate: Date,
  mode: CalendarMode,
  bounds: { min: Date; max: Date }
) => {
  if (mode === "week") {
    const weekStart = getWeekStart(candidate);
    return weekStart >= addDays(bounds.min, -6) && weekStart <= addDays(bounds.max, 7);
  }
  if (mode === "3days") return candidate >= bounds.min && candidate <= bounds.max;
  const monthStart = truncateToDay(new Date(candidate.getFullYear(), candidate.getMonth(), 1));
  return monthStart >= bounds.min && monthStart <= bounds.max;
};
